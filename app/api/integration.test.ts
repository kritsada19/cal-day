/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { GET as getMeals, POST as createMeal } from "@/app/api/meals/route";
import { DELETE as deleteMeal } from "@/app/api/meals/[id]/route";
import { GET as getDailyMeals } from "@/app/api/meals/daily/route";
import { GET as getProfile, POST as saveProfile } from "@/app/api/profile/route";
import prisma from "@/lib/db/prisma";
import { analyzeFood } from "@/lib/services/ai";
import { checkAndComsumeAiQuota, getUserAiQuota } from "@/lib/services/ai-quota";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Session } from "next-auth";
import type { RateLimitResult } from "@/lib/rate-limit";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
  }),
}));

vi.mock("@/lib/services/ai", () => ({
  analyzeFood: vi.fn(),
}));

vi.mock("@/lib/services/ai-quota", () => ({
  getUserAiQuota: vi.fn(),
  checkAndComsumeAiQuota: vi.fn(),
}));

describe("API Integration Tests", () => {
  const mockSession = vi.mocked(getSession);
  const mockRateLimit = vi.mocked(checkRateLimit);
  const mockAnalyzeFood = vi.mocked(analyzeFood);
  const mockQuotaCheck = vi.mocked(checkAndComsumeAiQuota);
  const mockGetQuota = vi.mocked(getUserAiQuota);
  const mockPrisma = vi.mocked(prisma, true);

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, limit: 100, remaining: 99 } as RateLimitResult);
  });

  it("POST /api/meals should create a meal and update daily summary", async () => {
    // ทดสอบ flow หลักของ endpoint นี้:
    // 1) ตรวจ session
    // 2) validate input
    // 3) เรียก AI วิเคราะห์อาหาร
    // 4) ตรวจ quota
    // 5) บันทึก Meal + FoodEntry + DailySummary
    mockSession.mockResolvedValue({
      user: { id: 7, email: "alice@example.com", name: "Alice" },
    } as Session);

    mockAnalyzeFood.mockResolvedValue({
      foods: [{
        name: "Salmon rice bowl",
        amount: 1,
        unit: "bowl",
        calories: 540,
        protein: 30,
      }],
      estimatedCalories: 540,
      estimatedProtein: 30,
      note: "Healthy lunch option",
    });

    mockQuotaCheck.mockResolvedValue(undefined);



    mockPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      subscription: { plan: "FREE" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockPrisma.foodEntry.findMany.mockResolvedValue([]);

    const tx = {
      meal: {
        create: vi.fn().mockResolvedValue({ id: 12 }),
      },
      foodEntry: {
        createMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          targetCalories: 2100,
          targetProtein: 130,
        }),
      },
      dailySummary: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 99 }),
        update: vi.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx as any));

    const request = new NextRequest("http://localhost/api/meals", {
      method: "POST",
      body: JSON.stringify({
        mealText: "Salmon rice bowl",
        mealType: "LUNCH",
        date: "2026-08-26",
      }),
    });

    const response = await createMeal(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockAnalyzeFood).toHaveBeenCalledWith("Salmon rice bowl");
    expect(mockQuotaCheck).toHaveBeenCalledWith(7, "FREE");
    expect(tx.meal.create).toHaveBeenCalledWith({
      data: { userId: 7, mealType: "LUNCH" },
    });
    expect(tx.dailySummary.create).toHaveBeenCalled();
    expect(body.mealId).toBe(12);
    expect(body.totalCalories).toBe(540);
    expect(body.totalProtein).toBe(30);
  });

  it("GET /api/meals should return the monthly daily summary for the current user", async () => {
    // Endpoint นี้คาดหวังว่าต้อง return summaries ตามช่วงเดือนที่ผู้ใช้ส่งมา
    // เราจึง mock `dailySummary.findMany` ให้คืนค่า array อย่างเดียวแล้วเช็กว่า response ถูก produce ตามที่ expect
    mockSession.mockResolvedValue({
      user: { id: 7 },
    } as Session);

    mockPrisma.dailySummary.findMany.mockResolvedValue([
      {
        id: 1,
        userId: 7,
        date: new Date("2026-08-05T00:00:00.000Z"),
        totalCalories: 1450,
        totalProtein: 88,
        targetCalories: 2100,
        targetProtein: 130,
      },
    ]);

    const request = new NextRequest("http://localhost/api/meals?year=2026&month=8");
    const response = await getMeals(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summaries).toHaveLength(1);
    expect(body.summaries[0]).toMatchObject({
      userId: 7,
      totalCalories: 1450,
      totalProtein: 88,
    });
  });

  it("GET /api/profile should return user profile information and AI usage data", async () => {
    // Profile GET มีหน้าที่รวม user profile + nutrition summary + ai quota เข้าเป็น payload เดียว
    mockSession.mockResolvedValue({
      user: { id: 7 },
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      name: "Alice",
      email: "alice@example.com",
      subscription: { plan: "FREE" },
      profile: {
        id: 1,
        userId: 7,
        gender: "MALE",
        age: 30,
        weight: 70,
        height: 175,
        exerciseLevel: "MODERATE",
        goal: "LOSE_WEIGHT",
        bmr: 1649,
        tdee: 2556,
        targetCalories: 2056,
        targetProtein: 126,
        updatedAt: new Date(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockPrisma.dailySummary.findFirst.mockResolvedValue({
      id: 1,
      userId: 7,
      date: new Date(),
      totalCalories: 1100,
      totalProtein: 70,
      targetCalories: 2056,
      targetProtein: 126,
    });

    mockGetQuota.mockResolvedValue({
      usage: 2,
      limit: 5,
      remaining: 3,
    });

    const request = new NextRequest("http://localhost/api/profile");
    const response = await getProfile(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Alice");
    expect(body.aiUsage).toBe(2);
    expect(body.aiRemaining).toBe(3);
    expect(body.profile.targetCalories).toBe(2056);
    expect(body.nutritionTargets.calories).toBe(2056);
  });

  it("POST /api/profile should create or update profile with calculated nutrition targets", async () => {
    // Endpoint นี้ต้องคำนวณค่า nutrition จากข้อมูลส่วนตัวแล้ว save ลง DB
    // ถ้า profile ยังไม่มีอยู่ ให้ใช้ create ถ้ามีแล้วใช้ update
    mockSession.mockResolvedValue({
      user: { id: 7 },
    } as Session);

    mockPrisma.profile.findUnique.mockResolvedValue(null);
    mockPrisma.profile.create.mockResolvedValue({
      id: 3,
      userId: 7,
      gender: "MALE",
      age: 30,
      weight: 70,
      height: 175,
      exerciseLevel: "MODERATE",
      goal: "LOSE_WEIGHT",
      bmr: 1649,
      tdee: 2556,
      targetCalories: 2056,
      targetProtein: 126,
      updatedAt: new Date(),
    });

    const request = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({
        gender: "MALE",
        age: 30,
        weight: 70,
        height: 175,
        exerciseLevel: "MODERATE",
        goal: "LOSE_WEIGHT",
      }),
    });

    const response = await saveProfile(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.profile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 7,
        gender: "MALE",
        targetCalories: 2056,
        targetProtein: 126,
      }),
    });
    expect(body.message).toBe("Profile saved successfully");
    expect(body.profile.targetCalories).toBe(2056);
  });

  it("POST /api/meals should return 429 and not call the AI when the AI quota is already used up", async () => {
    // โควต้า AI ถูกหักไปแล้ว → ต้องได้ 429 พร้อมข้อความจากตัวเช็คโควต้า และห้ามเรียก AI ซ้ำ
    mockSession.mockResolvedValue({
      user: { id: 7, email: "alice@example.com", name: "Alice" },
    } as Session);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 7,
      subscription: { plan: "FREE" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockQuotaCheck.mockResolvedValue(
      NextResponse.json(
        { message: "AI limit reached. Please upgrade to premium to continue." },
        { status: 429 },
      ),
    );

    const request = new NextRequest("http://localhost/api/meals", {
      method: "POST",
      body: JSON.stringify({
        mealText: "Shrimp pad thai",
        mealType: "DINNER",
        date: "2026-08-26",
      }),
    });

    const response = await createMeal(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.message).toBe("AI limit reached. Please upgrade to premium to continue.");
    expect(mockAnalyzeFood).not.toHaveBeenCalled();
  });

  it("GET /api/meals should reject a month outside 1-12", async () => {
    // พารามิเตอร์เดือนผิด → 400 และไม่ต้องแตะฐานข้อมูลเลย
    mockSession.mockResolvedValue({ user: { id: 7 } } as Session);

    const response = await getMeals(
      new NextRequest("http://localhost/api/meals?year=2026&month=13"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Invalid date parameters" });
    expect(mockPrisma.dailySummary.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/meals/daily should return the meals logged on that date", async () => {
    // เทสต์นี้มองพฤติกรรมที่ผู้ใช้เห็น: ส่งวันที่เข้าไป → ได้รายการมื้ออาหารของวันนั้นกลับมา
    mockSession.mockResolvedValue({ user: { id: 7 } } as Session);

    mockPrisma.meal.findMany.mockResolvedValue([
      {
        id: 12,
        userId: 7,
        mealType: "LUNCH",
        createdAt: new Date("2026-08-26T03:00:00.000Z"),
        foodEntries: [
          {
            id: 1,
            mealId: 12,
            foodName: "Salmon rice bowl",
            amount: 1,
            unit: "bowl",
            calories: 540,
            protein: 30,
          },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const response = await getDailyMeals(
      new NextRequest("http://localhost/api/meals/daily?date=2026-08-26"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meals).toHaveLength(1);
    expect(body.meals[0].foodEntries[0].foodName).toBe("Salmon rice bowl");
  });

  it("GET /api/meals/daily should return 400 when the date is missing", async () => {
    mockSession.mockResolvedValue({ user: { id: 7 } } as Session);

    const response = await getDailyMeals(new NextRequest("http://localhost/api/meals/daily"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Date is required" });
  });

  it("DELETE /api/meals/:id should delete the meal and roll its calories back from the daily summary", async () => {
    // มื้อนี้มี 2 จาน จานละ 300 kcal / 20 g → ต้องหักออก 600 kcal / 40 g (ไม่ใช่ 300/20)
    mockSession.mockResolvedValue({ user: { id: 7 } } as Session);

    mockPrisma.meal.findFirst.mockResolvedValue({
      id: 12,
      userId: 7,
      mealType: "LUNCH",
      createdAt: new Date("2026-08-26T03:00:00.000Z"),
      foodEntries: [
        {
          id: 1,
          mealId: 12,
          foodName: "Salmon rice bowl",
          amount: 2,
          unit: "bowl",
          calories: 300,
          protein: 20,
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockPrisma.dailySummary.findFirst.mockResolvedValue({
      id: 99,
      userId: 7,
      date: new Date("2026-08-26T00:00:00.000Z"),
      totalCalories: 1450,
      totalProtein: 100,
      targetCalories: 2100,
      targetProtein: 130,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const tx = {
      dailySummary: { update: vi.fn().mockResolvedValue({}) },
      meal: { delete: vi.fn().mockResolvedValue({}) },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx as any));

    const response = await deleteMeal(
      new NextRequest("http://localhost/api/meals/12", { method: "DELETE" }),
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(response.status).toBe(200);
    expect(tx.dailySummary.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: { totalCalories: 850, totalProtein: 60 },
    });
    expect(tx.meal.delete).toHaveBeenCalledWith({ where: { id: 12 } });
  });

  it("DELETE /api/meals/:id should return 404 when the meal belongs to someone else", async () => {
    mockSession.mockResolvedValue({ user: { id: 7 } } as Session);
    mockPrisma.meal.findFirst.mockResolvedValue(null);

    const response = await deleteMeal(
      new NextRequest("http://localhost/api/meals/999", { method: "DELETE" }),
      { params: Promise.resolve({ id: "999" }) },
    );

    expect(response.status).toBe(404);
  });

  it("DELETE /api/meals/:id should return 401 when the user is not logged in", async () => {
    mockSession.mockResolvedValue(null);

    const response = await deleteMeal(
      new NextRequest("http://localhost/api/meals/12", { method: "DELETE" }),
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(response.status).toBe(401);
  });
});
