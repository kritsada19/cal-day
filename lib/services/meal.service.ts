import { analyzeFood, analyzeFoodImage } from "./ai";
import { checkAndComsumeAiQuota } from "./ai-quota";
import { AppError } from "./errors";
import { deleteUserCache, getCache, setCache } from "@/lib/cache";
import { getUtcDayRange, getUtcMonthRange } from "@/lib/date";
import {
  mealRepository,
  type DailySummary,
  type ExistingFood,
  type MealRepository,
  type MealWithFoodEntries,
  type NewFoodEntry,
} from "@/lib/repositories/meal.repository";
import type { MealInput, ImageMealInput } from "@/lib/validation/meal";

/**
 * ชั้น Service = "เชฟ" ของร้านอาหาร
 * เป็นที่เก็บ "กฎธุรกิจ" ทั้งหมด เช่น วิธีแยกเมนู, วิธีเทียบชื่ออาหาร,
 * เมนูไหนต้องส่งให้ AI, ต้องคำนวณอะไรบ้าง, cache ต้องล้างตอนไหน
 *
 * กฎสำคัญ: service ห้ามรู้จัก NextRequest / NextResponse
 * ถ้าจะบอกว่า "คำขอนี้ผิด" ให้โยน AppError ออกไป แล้วให้ route แปลเป็น HTTP status เอง
 */

/** ผลลัพธ์จาก AI (ดึงชนิดจากฟังก์ชัน analyzeFood ของเดิม ไม่ต้องประกาศซ้ำ) */
type AiAnalysis = Awaited<ReturnType<typeof analyzeFood>>;

/** ผลลัพธ์ที่ได้หลังบันทึกมื้ออาหารสำเร็จ */
export type CreateMealResult = {
  mealId: number;
  aiAnalysis: AiAnalysis | null;
  totalCalories: number;
  totalProtein: number;
};

/**
 * แยกข้อความที่ผู้ใช้พิมพ์ออกเป็นเมนูย่อย ๆ
 * เช่น "ข้าวมันไก่, ไข่ต้ม" → ["ข้าวมันไก่", "ไข่ต้ม"]
 */
export function splitMenuItems(rawText: string): string[] {
  return rawText
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * ทำให้ชื่ออาหารเทียบกันได้ง่ายขึ้น
 * ตัดช่องว่างทั้งหมดออก และทำเป็นตัวพิมพ์เล็ก เช่น "ข้าว มัน ไก่ " → "ข้าวมันไก่"
 */
const normalizeFoodName = (text: string) =>
  text.trim().toLowerCase().replace(/\s+/g, "");

/**
 * เทียบเมนูที่ผู้ใช้พิมพ์ กับอาหารที่เคยบันทึกไว้ใน DB
 *
 * หลักการ: ถ้าชื่อเมนูมีชื่ออาหารที่รู้จักอยู่ข้างใน ก็ถือว่า "รู้จัก"
 * แล้วตัดชื่อนั้นออกจากข้อความ (เมนูเดียวอาจมีหลายอย่าง เช่น "ข้าว + ไข่")
 * ถ้ายังเหลือข้อความที่จับคู่ไม่ได้ แปลว่าเมนูนั้นต้องส่งให้ AI วิเคราะห์
 */
export function matchKnownFoods(
  menuItems: string[],
  existingFoods: ExistingFood[],
): { matchedFoods: ExistingFood[]; unknownMenuItems: string[] } {
  // เรียงชื่อที่ยาวกว่าขึ้นก่อน เพื่อไม่ให้ "ไข่" แย่ง match กับ "ไข่ต้ม"
  const sortedFoods = [...existingFoods].sort(
    (a, b) =>
      normalizeFoodName(b.foodName).length -
      normalizeFoodName(a.foodName).length,
  );

  const matchedFoods: ExistingFood[] = [];
  const unknownMenuItems: string[] = [];

  for (const menuItem of menuItems) {
    let remainingText = normalizeFoodName(menuItem);

    for (const food of sortedFoods) {
      const normalizedFoodName = normalizeFoodName(food.foodName);

      if (remainingText.includes(normalizedFoodName)) {
        matchedFoods.push(food);
        remainingText = remainingText.replace(normalizedFoodName, "");
      }
    }

    // หลังตัดชื่อที่รู้จักออกแล้วยังเหลือข้อความ = เมนูนี้ยังไม่รู้จัก
    if (remainingText.trim().length > 0) {
      unknownMenuItems.push(menuItem);
    }
  }

  return { matchedFoods, unknownMenuItems };
}

export class MealService {
  /**
   * รับ repository เข้ามาทาง constructor (มีค่าเริ่มต้นเป็น instance จริง)
   * ทำให้ตอนเทสต์สลับเป็นตัวปลอมได้ง่าย โดยไม่ต้องแก้โค้ดข้างใน
   */
  constructor(private readonly repository: MealRepository = mealRepository) { }

  /**
   * สร้างมื้ออาหาร 1 มื้อ: แยกเมนู → เทียบกับ DB → ให้ AI วิเคราะห์ส่วนที่ไม่รู้ →
   * บันทึกผ่าน repository → ล้าง cache
   */
  async createMeal(
    userId: number,
    input: MealInput,
  ): Promise<CreateMealResult> {
    // 1) แยกเมนูที่ผู้ใช้พิมพ์ (คั่นด้วย ",")
    const menuItems = splitMenuItems(input.mealText);
    if (menuItems.length === 0) {
      throw new AppError(400, "Invalid input");
    }

    // 2) ช่วงเวลาของวันที่จะบันทึก (ถ้าไม่ส่งวันที่มา ถือว่าเป็น "วันนี้")
    const { startOfDay, endOfDay } = getUtcDayRange(input.date ?? new Date());

    // 3) ผู้ใช้ต้องมีอยู่จริง และต้องรู้แพ็กเกจเพื่อคิดโควต้า AI
    const user = await this.repository.findUserWithSubscription(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    // 4) หักและตรวจโควต้า AI ของวันนี้
    const quotaExceeded = await checkAndComsumeAiQuota(
      userId,
      user.subscription?.plan,
    );

    if (quotaExceeded) {
      // checkAndComsumeAiQuota เป็นโค้ดเดิมที่คืน NextResponse เมื่อโควต้าหมด
      // เราอ่าน message/status ออกมาแล้วโยนเป็น AppError เพื่อไม่ให้ service ผูกกับ HTTP
      const body = (await quotaExceeded.json()) as { message?: string };
      throw new AppError(quotaExceeded.status, body.message ?? "AI limit reached");
    }

    // 5) เทียบเมนูกับอาหารที่เคยบันทึกไว้ใน DB
    const existingFoods = await this.repository.findExistingFoods();
    const { matchedFoods, unknownMenuItems } = matchKnownFoods(
      menuItems,
      existingFoods,
    );

    // 6) เมนูที่ไม่รู้จัก → ส่งให้ AI วิเคราะห์ (ส่งเฉพาะเมนูนั้น ไม่ส่งทั้งหมด)
    const aiAnalysis =
      unknownMenuItems.length > 0
        ? await analyzeFood(unknownMenuItems.join(", "))
        : null;

    // 7) เตรียมรายการอาหารที่จะบันทึก (ของเดิมใน DB + ของใหม่จาก AI)
    const foodEntries: NewFoodEntry[] = [
      ...matchedFoods.map((food) => ({
        foodName: food.foodName,
        amount: food.amount || 1,
        unit: food.unit || "serving",
        calories: food.calories || 0,
        protein: food.protein || 0,
      })),
      ...(aiAnalysis?.foods ?? []).map((food) => ({
        foodName: food.name,
        amount: food.amount || 1,
        unit: food.unit || "serving",
        calories: food.calories || 0,
        protein: food.protein || 0,
      })),
    ];

    // 8) คิดยอดรวมของมื้อนี้ (ถ้าแยกเป็นรายการไม่ได้เลย ใช้ค่าที่ AI ประเมินทั้งมื้อ)
    const totalCalories =
      foodEntries.length > 0
        ? foodEntries.reduce((sum, food) => sum + food.calories, 0)
        : aiAnalysis?.estimatedCalories ?? 0;

    const totalProtein =
      foodEntries.length > 0
        ? foodEntries.reduce((sum, food) => sum + food.protein, 0)
        : aiAnalysis?.estimatedProtein ?? 0;

    // 9) บันทึกลงฐานข้อมูล (repository จัดการ transaction ให้)
    const mealId = await this.repository.createMealWithEntries({
      userId,
      mealType: input.mealType,
      startOfDay,
      endOfDay,
      foodEntries,
      fallbackFoodName: input.mealText,
      fallbackCalories: aiAnalysis?.estimatedCalories ?? 0,
      fallbackProtein: aiAnalysis?.estimatedProtein ?? 0,
      totalCalories,
      totalProtein,
    });

    // 10) ข้อมูลสรุปเปลี่ยนแล้ว → ล้าง cache ของผู้ใช้คนนี้
    await deleteUserCache(userId);

    return { mealId, aiAnalysis, totalCalories, totalProtein };
  }

  async createMealFromImage(
    userId: number,
    input: ImageMealInput,
  ): Promise<CreateMealResult> {
    const { startOfDay, endOfDay } = getUtcDayRange(input.date ? new Date(input.date) : new Date());
    
    const user = await this.repository.findUserWithSubscription(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const quotaExceeded = await checkAndComsumeAiQuota(userId, user.subscription?.plan);
    if (quotaExceeded) {
      const body = (await quotaExceeded.json()) as { message?: string };
      throw new AppError(quotaExceeded.status, body.message ?? "AI limit reached");
    }

    const aiAnalysis = await analyzeFoodImage(input.base64Data, input.mimeType);

    const foodEntries: NewFoodEntry[] = (aiAnalysis.foods ?? []).map((food) => ({
      foodName: food.name,
      amount: food.amount || 1,
      unit: food.unit || "serving",
      calories: food.calories || 0,
      protein: food.protein || 0,
    }));

    const totalCalories = foodEntries.length > 0 
      ? foodEntries.reduce((sum, food) => sum + food.calories, 0)
      : aiAnalysis.estimatedCalories ?? 0;
      
    const totalProtein = foodEntries.length > 0
      ? foodEntries.reduce((sum, food) => sum + food.protein, 0)
      : aiAnalysis.estimatedProtein ?? 0;

    const mealId = await this.repository.createMealWithEntries({
      userId,
      mealType: input.mealType,
      startOfDay,
      endOfDay,
      foodEntries,
      fallbackFoodName: "Image Analysis",
      fallbackCalories: aiAnalysis.estimatedCalories ?? 0,
      fallbackProtein: aiAnalysis.estimatedProtein ?? 0,
      totalCalories,
      totalProtein,
    });

    await deleteUserCache(userId);

    return { mealId, aiAnalysis, totalCalories, totalProtein };
  }


  /**
   * ดึงสรุปรายวันทั้งเดือน (ใช้ cache 60 วินาที เพื่อลดการยิง DB ถี่ ๆ)
   */
  async getMonthlySummaries(
    userId: number,
    year: number,
    month: number,
  ): Promise<DailySummary[]> {
    // ตรวจค่าที่ส่งมาก่อน เพื่อไม่ให้ cache ตอบคำขอที่พารามิเตอร์ผิด
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError(400, "Invalid date parameters");
    }

    const cacheKey = `cache:user:${userId}:meals:month:${year}:${month}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const { start, end } = getUtcMonthRange(year, month);
    const summaries = await this.repository.getDailySummaries(userId, start, end);

    await setCache(cacheKey, summaries, 60);

    return summaries;
  }

  /**
   * ดึงมื้ออาหารของผู้ใช้ 1 วัน (รับวันที่รูปแบบ YYYY-MM-DD)
   */
  async getDailyMeals(
    userId: number,
    date: string | null,
  ): Promise<MealWithFoodEntries[]> {
    if (!date) {
      throw new AppError(400, "Date is required");
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new AppError(400, "Invalid date format");
    }

    const cacheKey = `cache:user:${userId}:meals:daily:${date}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const { startOfDay, endOfDay } = getUtcDayRange(targetDate);
    const meals = await this.repository.getMealsByDate(
      userId,
      startOfDay,
      endOfDay,
    );

    // มื้ออาหารของวันหนึ่งแทบไม่เปลี่ยน → cache ได้นาน 1 ชั่วโมง
    await setCache(cacheKey, meals, 60 * 60);

    return meals;
  }

  /**
   * ลบมื้ออาหาร 1 มื้อ แล้วล้าง cache ของผู้ใช้
   */
  async deleteMeal(mealId: number, userId: number): Promise<void> {
    const deletedMeal = await this.repository.deleteMeal(mealId, userId);

    if (!deletedMeal) {
      throw new AppError(404, "Meal not found or unauthorized");
    }

    await deleteUserCache(userId);
  }
}

/** ใช้ instance เดียวทั้งแอป — route แค่ import แล้วเรียกได้เลย */
export const mealService = new MealService();
