/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { GET as getMeals, POST as createMeal } from "@/app/api/meals/route";
import { GET as getProfile, POST as saveProfile } from "@/app/api/profile/route";
import prisma from "@/lib/db/prisma";
import { analyzeFood } from "@/lib/services/ai";
import { checkAndComsumeAiQuota, getUserAiQuota } from "@/lib/services/ai-quota";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Session } from "next-auth";
import type { RateLimitResult } from "@/lib/rate-limit";

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
  const mockSession = vi.mocked(getServerSession);
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
    } as any);

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
});
