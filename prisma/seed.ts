import "dotenv/config";
import prisma from "../lib/db/prisma";
import { Role, Gender, ExerciseLevel, Goal, MealType, Plan, SubscriptionStatus } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";


async function main() {
  logger.info("Starting database seed");

  // 1. ล้างข้อมูลเก่าออกก่อนเพื่อป้องกันปัญหา Duplicate Key หรือข้อมูลชนกันเมื่อรันซ้ำ
  logger.info("Removing existing database records");
  await prisma.subscription.deleteMany({});
  await prisma.dailySummary.deleteMany({});
  await prisma.foodEntry.deleteMany({});
  await prisma.meal.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  logger.info("Existing database records removed");

  // 2. เข้ารหัสรหัสผ่านสำหรับบัญชีทดสอบ
  logger.info("Hashing seed user passwords");
  const userPasswordHash = bcrypt.hashSync("password123", 10);
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);

  // 3. สร้างข้อมูลผู้ใช้งานทดสอบ (Test User)
  logger.info({ email: "test@example.com" }, "Creating seed test user");
  const testUser = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@example.com",
      password: userPasswordHash,
      role: Role.USER,
      emailVerified: new Date(),
    },
  });

  // 4. สร้างข้อมูลผู้ดูแลระบบทดสอบ (Admin User)
  logger.info({ email: "admin@example.com" }, "Creating seed admin user");
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPasswordHash,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  // 5. สร้างข้อมูลโปรไฟล์โภชนาการสำหรับ Test User (ใช้สำหรับคำนวณแคลอรีและโปรตีนเป้าหมาย)
  logger.info("Creating seed test user profile");
  const targetCalories = 1800; // แคลอรีเป้าหมายต่อวัน
  const targetProtein = 135;   // โปรตีนเป้าหมายต่อวัน (กรัม)
  await prisma.profile.create({
    data: {
      userId: testUser.id,
      gender: Gender.MALE,
      age: 28,
      weight: 75.0,
      height: 178.0,
      exerciseLevel: ExerciseLevel.MODERATE,
      goal: Goal.LOSE_WEIGHT,
      bmr: 1680.5,
      tdee: 2310.0,
      targetCalories,
      targetProtein,
    },
  });

  // 6. สร้างข้อมูลการสมัครสมาชิก (Subscription) ให้เป็นแบบ FREE ในตอนเริ่มต้น
  logger.info("Creating seed subscription");
  await prisma.subscription.create({
    data: {
      userId: testUser.id,
      stripeCustomerId: "cus_test_12345",
      plan: Plan.FREE,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  // 7. ตัวช่วยจัดการเกี่ยวกับวันที่เพื่อสร้างข้อมูลมื้ออาหารย้อนหลัง
  const now = new Date();
  
  // ฟังก์ชันหาเวลาเริ่มต้นของวัน (00:00:00 UTC) สำหรับฟิลด์ date ใน DailySummary
  const getPastDateStart = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  };

  // ฟังก์ชันหาเวลาเฉพาะสำหรับมื้ออาหาร (เช่น เช้า, กลางวัน, เย็น) ในอดีต
  const getPastDateWithTime = (daysAgo: number, hours: number, minutes: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes, 0, 0));
  };

  // 8. ข้อมูลจำลองมื้ออาหารและรายการอาหารย้อนหลัง 3 วัน (2 วันก่อน, เมื่อวานนี้, วันนี้)
  logger.info("Creating seed meal history");

  const sampleMealsData = [
    {
      daysAgo: 2, // 2 วันก่อนหน้า
      meals: [
        {
          mealType: MealType.BREAKFAST,
          time: { hours: 8, minutes: 0 },
          foods: [
            { foodName: "ไข่ต้ม (Boiled Eggs)", amount: 2, unit: "ฟอง", calories: 140, protein: 12 },
            { foodName: "ขนมปังโฮลวีต (Whole Wheat Bread)", amount: 2, unit: "แผ่น", calories: 160, protein: 6 },
          ],
        },
        {
          mealType: MealType.LUNCH,
          time: { hours: 12, minutes: 30 },
          foods: [
            { foodName: "ข้าวมันไก่ (Hainanese Chicken Rice)", amount: 1, unit: "จาน", calories: 600, protein: 25 },
          ],
        },
        {
          mealType: MealType.DINNER,
          time: { hours: 18, minutes: 45 },
          foods: [
            { foodName: "สเต็กปลาแซลมอน (Salmon Steak)", amount: 150, unit: "กรัม", calories: 350, protein: 30 },
            { foodName: "สลัดผักรวม (Mixed Salad)", amount: 1, unit: "ถ้วย", calories: 80, protein: 2 },
          ],
        },
      ],
    },
    {
      daysAgo: 1, // เมื่อวานนี้
      meals: [
        {
          mealType: MealType.BREAKFAST,
          time: { hours: 7, minutes: 45 },
          foods: [
            { foodName: "แซนวิชทูน่า (Tuna Sandwich)", amount: 1, unit: "ชิ้น", calories: 320, protein: 18 },
            { foodName: "กาแฟดำไม่ใส่น้ำตาล (Black Coffee)", amount: 1, unit: "แก้ว", calories: 5, protein: 0 },
          ],
        },
        {
          mealType: MealType.LUNCH,
          time: { hours: 13, minutes: 0 },
          foods: [
            { foodName: "กะเพราเนื้อสับ (Stir-fried Beef with Basil)", amount: 1, unit: "จาน", calories: 550, protein: 28 },
            { foodName: "ข้าวสวย (Jasmine Rice)", amount: 150, unit: "กรัม", calories: 200, protein: 4 },
          ],
        },
        {
          mealType: MealType.SNACK,
          time: { hours: 16, minutes: 0 },
          foods: [
            { foodName: "แอปเปิ้ล (Apple)", amount: 1, unit: "ผล", calories: 80, protein: 0.5 },
          ],
        },
        {
          mealType: MealType.DINNER,
          time: { hours: 19, minutes: 15 },
          foods: [
            { foodName: "เวย์โปรตีน (Whey Protein Shake)", amount: 1, unit: "สกู๊ป", calories: 120, protein: 24 },
          ],
        },
      ],
    },
    {
      daysAgo: 0, // วันนี้
      meals: [
        {
          mealType: MealType.BREAKFAST,
          time: { hours: 8, minutes: 15 },
          foods: [
            { foodName: "โจ๊กข้าวโอ๊ตใส่นม (Oatmeal with Milk)", amount: 1, unit: "ถ้วย", calories: 250, protein: 8 },
            { foodName: "กล้วยหอม (Banana)", amount: 1, unit: "ผล", calories: 105, protein: 1.3 },
          ],
        },
        {
          mealType: MealType.LUNCH,
          time: { hours: 12, minutes: 15 },
          foods: [
            { foodName: "สลัดอกไก่ย่าง (Grilled Chicken Salad)", amount: 1, unit: "จาน", calories: 380, protein: 35 },
          ],
        },
      ],
    },
  ];

  // นำเข้าข้อมูลมื้ออาหาร รายการอาหาร และคำนวณสรุปโภชนาการรายวัน (DailySummary)
  for (const dayData of sampleMealsData) {
    const startOfDayDate = getPastDateStart(dayData.daysAgo);
    let dayTotalCalories = 0;
    let dayTotalProtein = 0;

    for (const mealData of dayData.meals) {
      const mealCreatedAt = getPastDateWithTime(dayData.daysAgo, mealData.time.hours, mealData.time.minutes);
      
      // สร้างมื้ออาหาร
      const createdMeal = await prisma.meal.create({
        data: {
          userId: testUser.id,
          mealType: mealData.mealType,
          createdAt: mealCreatedAt,
        },
      });

      // สร้างรายการอาหารสำหรับมื้อนั้นๆ
      for (const food of mealData.foods) {
        await prisma.foodEntry.create({
          data: {
            mealId: createdMeal.id,
            foodName: food.foodName,
            amount: food.amount,
            unit: food.unit,
            calories: food.calories,
            protein: food.protein,
          },
        });

        // สะสมยอดรวมแคลอรีและโปรตีนประจำวัน
        dayTotalCalories += food.calories;
        dayTotalProtein += food.protein;
      }
    }

    // สร้าง DailySummary สำหรับแต่ละวันเพื่อให้ค่าสอดคล้องกับมื้ออาหารที่บันทึกไว้
    logger.info({ daysAgo: dayData.daysAgo }, "Creating seed daily nutrition summary");
    await prisma.dailySummary.create({
      data: {
        userId: testUser.id,
        date: startOfDayDate,
        totalCalories: Number(dayTotalCalories.toFixed(1)),
        totalProtein: Number(dayTotalProtein.toFixed(1)),
        targetCalories: targetCalories,
        targetProtein: targetProtein,
      },
    });
  }

  logger.info("Database seed completed");
}

main()
  .then(async () => {
    // ปิดการเชื่อมต่อฐานข้อมูลเมื่อรันสำเร็จ
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    logger.error({ err: e }, "Database seed failed");
    // ปิดการเชื่อมต่อฐานข้อมูลหากมีข้อผิดพลาด
    await prisma.$disconnect();
    process.exit(1);
  });
