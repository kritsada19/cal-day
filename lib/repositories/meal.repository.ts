import prisma from "@/lib/db/prisma";
import { getUtcDayRange } from "@/lib/date";
import type { MealType } from "@/app/generated/prisma/enums";
import type {
  DailySummaryModel,
  FoodEntryModel,
  MealGetPayload,
} from "@/app/generated/prisma/models";

/**
 * ชั้น Repository = "ห้องเก็บวัตถุดิบ" ของร้านอาหาร
 * หน้าที่เดียวคือ "อ่าน/เขียนฐานข้อมูล" เท่านั้น
 * ห้ามตัดสินใจเรื่องกฎธุรกิจ (เช่น ห้ามตัดสินใจว่าเมนูไหนควรส่งให้ AI)
 * และห้ามรู้จัก NextRequest / NextResponse
 *
 * ข้อดี: เรื่อง query/transaction รวมอยู่ที่เดียว ทำให้ service อ่านง่ายและเทสต์ง่าย
 */

/** ชนิดข้อมูลสรุปรายวัน (ตรงกับตาราง DailySummary) */
export type DailySummary = DailySummaryModel;

/** ชนิดข้อมูลรายการอาหาร (ตรงกับตาราง FoodEntry) */
export type FoodEntry = FoodEntryModel;

/** มื้ออาหารพร้อมรายการอาหารข้างใน (ใช้เป็นชนิดข้อมูลส่งกลับของ query) */
export type MealWithFoodEntries = MealGetPayload<{ include: { foodEntries: true } }>;

/** รายการอาหาร 1 อย่างที่ดึงจาก DB มาใช้ "เทียบชื่อ" กับที่ผู้ใช้พิมพ์ */
export type ExistingFood = Pick<
  FoodEntry,
  "foodName" | "amount" | "unit" | "calories" | "protein"
>;

/** รายการอาหาร 1 อย่างที่ "พร้อมบันทึก" (ยังไม่มี mealId เพราะมื้ออาหารยังไม่ถูกสร้าง) */
export type NewFoodEntry = ExistingFood;

/** ข้อมูลที่ต้องใช้ในการสร้างมื้ออาหาร 1 มื้อ (service เตรียมมาให้ครบแล้ว) */
export type CreateMealWithEntriesInput = {
  userId: number;
  mealType: MealType;
  /** ช่วงเวลาของวันที่จะบันทึก (ใช้หาสรุปรายวันของวันนั้น) */
  startOfDay: Date;
  endOfDay: Date;
  /** รายการอาหารที่แยกได้ (จาก DB + จาก AI) ถ้าว่างแปลว่าแยกไม่ได้เลย */
  foodEntries: NewFoodEntry[];
  /** ข้อความดิบที่ผู้ใช้พิมพ์ ใช้เป็นชื่ออาหารกรณียังแยกเป็นรายการไม่ได้ */
  fallbackFoodName: string;
  /** ค่าที่ AI ประเมินไว้ ใช้เมื่อไม่มีรายการอาหารเลย */
  fallbackCalories: number;
  fallbackProtein: number;
  /** ยอดรวมของมื้อนี้ที่ service คำนวณมาแล้ว */
  totalCalories: number;
  totalProtein: number;
};

/** ปัดทศนิยมให้เหลือ 1 ตำแหน่ง (ค่าแคลอรี/โปรตีนใช้ทศนิยม 1 ตำแหน่งทั้งระบบ) */
const round1 = (value: number) => Number(value.toFixed(1));

export class MealRepository {
  /**
   * ดึงอาหารทั้งหมดที่เคยบันทึกไว้ (ชื่อไม่ซ้ำ) เพื่อเอาไปเทียบกับเมนูที่ผู้ใช้พิมพ์
   */
  async findExistingFoods(): Promise<ExistingFood[]> {
    return prisma.foodEntry.findMany({
      distinct: ["foodName"],
      select: {
        foodName: true,
        amount: true,
        unit: true,
        calories: true,
        protein: true,
      },
    });
  }

  /**
   * ดึงผู้ใช้พร้อมแพ็กเกจ (FREE / PRO) — ใช้ตัดสินโควต้า AI ของวันนี้
   */
  async findUserWithSubscription(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
  }

  /**
   * บันทึกมื้ออาหาร + รายการอาหาร + อัปเดตสรุปรายวัน
   * ทั้งหมดอยู่ใน transaction เดียว ถ้าขั้นตอนใดพัง ข้อมูลจะไม่ถูกบันทึกครึ่ง ๆ กลาง ๆ
   *
   * @returns id ของมื้ออาหารที่สร้างใหม่
   */
  async createMealWithEntries(
    input: CreateMealWithEntriesInput,
  ): Promise<number> {
    const mealId = await prisma.$transaction(async (tx) => {
      const meal = await tx.meal.create({
        data: {
          userId: input.userId,
          mealType: input.mealType,
        },
      });

      if (input.foodEntries.length === 0) {
        // แยกเป็นรายการอาหารไม่ได้เลย → เก็บข้อความดิบที่ผู้ใช้พิมพ์ไว้ 1 แถว
        await tx.foodEntry.create({
          data: {
            mealId: meal.id,
            foodName: input.fallbackFoodName,
            amount: 1,
            unit: "text",
            calories: input.fallbackCalories,
            protein: input.fallbackProtein,
          },
        });
      } else {
        await tx.foodEntry.createMany({
          data: input.foodEntries.map((food) => ({
            mealId: meal.id,
            foodName: food.foodName,
            amount: food.amount || 1,
            unit: food.unit || "serving",
            calories: food.calories || 0,
            protein: food.protein || 0,
          })),
        });
      }

      // เป้าหมายของวันนี้ (ถ้าผู้ใช้ยังไม่ได้ทำโปรไฟล์ จะได้ 0)
      const profile = await tx.profile.findUnique({
        where: { userId: input.userId },
      });

      const targetCalories = profile?.targetCalories ?? 0;
      const targetProtein = profile?.targetProtein ?? 0;

      // วันนี้มีสรุปอยู่แล้วหรือยัง? (หาด้วย "ช่วงวัน" ไม่ใช่ timestamp ตรง ๆ)
      const existingSummary = await tx.dailySummary.findFirst({
        where: {
          userId: input.userId,
          date: {
            gte: input.startOfDay,
            lt: input.endOfDay,
          },
        },
      });

      if (existingSummary) {
        // มีแล้ว → บวกเพิ่มเข้าไป
        await tx.dailySummary.update({
          where: { id: existingSummary.id },
          data: {
            totalCalories: round1(
              existingSummary.totalCalories + input.totalCalories,
            ),
            totalProtein: round1(
              existingSummary.totalProtein + input.totalProtein,
            ),
            targetCalories,
            targetProtein,
          },
        });
      } else {
        // วันนี้ยังไม่มี → สร้างใหม่ โดยให้ date ตรงกับต้นวัน
        await tx.dailySummary.create({
          data: {
            userId: input.userId,
            date: input.startOfDay,
            totalCalories: round1(input.totalCalories),
            totalProtein: round1(input.totalProtein),
            targetCalories,
            targetProtein,
          },
        });
      }

      return meal.id;
    });

    return mealId;
  }

  /**
   * ดึงสรุปรายวันของผู้ใช้ตามช่วงเวลาที่กำหนด (เรียงจากวันเก่าไปใหม่)
   */
  async getDailySummaries(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<DailySummary[]> {
    return prisma.dailySummary.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  /**
   * ดึงมื้ออาหารของผู้ใช้ในหนึ่งวัน พร้อมรายการอาหารในมื้อนั้น
   */
  async getMealsByDate(
    userId: number,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<MealWithFoodEntries[]> {
    return prisma.meal.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        foodEntries: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * ลบมื้ออาหาร และหักแคลอรี/โปรตีนของมื้อนั้นออกจากสรุปรายวัน
   *
   * จุดที่แก้จากเวอร์ชันเดิม:
   * 1) หาสรุปรายวันด้วย "ช่วงวันเดียวกับตอนสร้าง" (เดิมเทียบ createdAt ตรง ๆ ทำให้หาไม่เจอ → 404)
   * 2) หักเป็น calories × amount ให้ตรงกับตอนบวกตอนสร้าง (เดิมหักแค่ calories)
   * 3) ถ้าไม่พบสรุปรายวัน ก็ลบมื้ออาหารได้ (เดิมคืน 404 ทั้งที่มื้อเป็นของผู้ใช้จริง)
   *
   * @returns มื้ออาหารที่ถูกลบ หรือ null ถ้าไม่พบมื้อนี้ของผู้ใช้คนนี้
   */
  async deleteMeal(
    mealId: number,
    userId: number,
  ): Promise<MealWithFoodEntries | null> {
    // หาเฉพาะมื้อที่เป็นของผู้ใช้คนนี้ (กันคนอื่นลบมื้อของเรา)
    const meal = await prisma.meal.findFirst({
      where: { id: mealId, userId },
      include: { foodEntries: true },
    });

    if (!meal) return null;

    const { startOfDay, endOfDay } = getUtcDayRange(meal.createdAt);

    const summary = await prisma.dailySummary.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const totalCalories = meal.foodEntries.reduce(
      (sum, food) => sum + food.calories * food.amount,
      0,
    );
    const totalProtein = meal.foodEntries.reduce(
      (sum, food) => sum + food.protein * food.amount,
      0,
    );

    await prisma.$transaction(async (tx) => {
      if (summary) {
        await tx.dailySummary.update({
          where: { id: summary.id },
          data: {
            // Math.max(0, ...) กันค่าติดลบที่เกิดจากเศษทศนิยม
            totalCalories: round1(
              Math.max(0, summary.totalCalories - totalCalories),
            ),
            totalProtein: round1(
              Math.max(0, summary.totalProtein - totalProtein),
            ),
          },
        });
      }

      await tx.meal.delete({
        where: { id: mealId },
      });
    });

    return meal;
  }
}

/**
 * ใช้ instance เดียวทั้งแอป (ไม่ต้อง new เองทุกครั้ง)
 * ทำให้ route/service แค่ import แล้วเรียกใช้ได้เลย
 */
export const mealRepository = new MealRepository();
