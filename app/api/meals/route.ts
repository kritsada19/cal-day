import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeFood } from "@/lib/services/ai";
import { checkAndComsumeAiQuota } from "@/lib/services/ai-quota";
import { mealSchema } from "@/lib/validation/meal";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "meals", 100, 60);

  if (!rateLimit.success) {
    return NextResponse.json(
      { message: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const validation = mealSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message:
          validation.error.issues[0]?.message || "Invalid input",
      },
      { status: 400 }
    );
  }

  const {
    mealText: rawText,
    mealType,
    date: localDateStr,
  } = validation.data;

  const userId = Number(session.user.id);

  // =========================
  // Date
  // =========================

  let startOfDay: Date;
  let endOfDay: Date;

  if (localDateStr) {
    startOfDay = new Date(
      `${localDateStr}T00:00:00.000Z`
    );

    endOfDay = new Date(
      `${localDateStr}T23:59:59.999Z`
    );
  } else {
    const now = new Date();

    startOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );
  }

  // =========================
  // User
  // =========================

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  // =========================
  // AI Quota
  // =========================

  const quotaResponse = await checkAndComsumeAiQuota(
    userId,
    user.subscription?.plan as string
  );

  if (quotaResponse) {
    return quotaResponse;
  }

  // =========================
  // Normalize text
  // =========================

  const normalize = (text: string) =>
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

  const normalizedInput = normalize(rawText);

  // =========================
  // หาเมนูเดิมจาก FoodEntry
  // =========================

  const existingFoods = await prisma.foodEntry.findMany({
    distinct: ["foodName"],
    select: {
      foodName: true,
      amount: true,
      unit: true,
      calories: true,
      protein: true,
    },
  });

  // เรียงชื่อยาวก่อน
  // ป้องกัน "ไข่" match ก่อน "ไข่ต้ม"
  existingFoods.sort(
    (a, b) =>
      normalize(b.foodName).length -
      normalize(a.foodName).length
  );

  const foundFoods: typeof existingFoods = [];
  let remainingText = normalizedInput;

  // =========================
  // Match เมนูจาก DB
  // =========================

  for (const food of existingFoods) {
    const normalizedFoodName = normalize(food.foodName);

    if (remainingText.includes(normalizedFoodName)) {
      foundFoods.push(food);

      remainingText = remainingText.replace(
        normalizedFoodName,
        ""
      );
    }
  }

  // =========================
  // ถ้ายังมีเมนูที่ไม่รู้จัก
  // → AI
  // =========================

  let aiAnalysis: Awaited<
    ReturnType<typeof analyzeFood>
  > | null = null;

  let aiQuotaConsumed = false;

  if (remainingText.trim().length > 0) {
    // ใช้ข้อความต้นฉบับให้ AI วิเคราะห์
    aiAnalysis = await analyzeFood(rawText);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // =========================
      // Create Meal
      // =========================

      const meal = await tx.meal.create({
        data: {
          userId,
          mealType,
        },
      });

      // =========================
      // เตรียม FoodEntry
      // =========================

      const foodEntries = [
        // เมนูที่เจอใน DB
        ...foundFoods.map((food) => ({
          mealId: meal.id,
          foodName: food.foodName,
          amount: food.amount || 1,
          unit: food.unit || "serving",
          calories: food.calories || 0,
          protein: food.protein || 0,
        })),

        // เมนูที่ AI วิเคราะห์
        ...(aiAnalysis?.foods ?? []).map((food) => ({
          mealId: meal.id,
          foodName: food.name,
          amount: food.amount || 1,
          unit: food.unit || "serving",
          calories: food.calories || 0,
          protein: food.protein || 0,
        })),
      ];

      // =========================
      // ถ้าไม่มี food เลย
      // =========================

      if (foodEntries.length === 0) {
        await tx.foodEntry.create({
          data: {
            mealId: meal.id,
            foodName: rawText,
            amount: 1,
            unit: "text",
            calories: aiAnalysis?.estimatedCalories ?? 0,
            protein: aiAnalysis?.estimatedProtein ?? 0,
          },
        });
      } else {
        await tx.foodEntry.createMany({
          data: foodEntries,
        });
      }

      // =========================
      // Calculate total
      // =========================

      const totalCalories =
        foodEntries.length > 0
          ? foodEntries.reduce(
            (sum, food) =>
              sum + food.calories * food.amount,
            0
          )
          : aiAnalysis?.estimatedCalories ?? 0;

      const totalProtein =
        foodEntries.length > 0
          ? foodEntries.reduce(
            (sum, food) =>
              sum + food.protein * food.amount,
            0
          )
          : aiAnalysis?.estimatedProtein ?? 0;

      // =========================
      // Profile
      // =========================

      const profile = await tx.profile.findUnique({
        where: {
          userId,
        },
      });

      const targetCalories =
        profile?.targetCalories ?? 0;

      const targetProtein =
        profile?.targetProtein ?? 0;

      // =========================
      // Daily Summary
      // =========================

      const existingSummary =
        await tx.dailySummary.findFirst({
          where: {
            userId,
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

      if (existingSummary) {
        await tx.dailySummary.update({
          where: {
            id: existingSummary.id,
          },
          data: {
            totalCalories: Number(
              (
                existingSummary.totalCalories +
                totalCalories
              ).toFixed(1)
            ),

            totalProtein: Number(
              (
                existingSummary.totalProtein +
                totalProtein
              ).toFixed(1)
            ),

            targetCalories,
            targetProtein,
          },
        });
      } else {
        await tx.dailySummary.create({
          data: {
            userId,
            date: startOfDay,

            totalCalories: Number(
              totalCalories.toFixed(1)
            ),

            totalProtein: Number(
              totalProtein.toFixed(1)
            ),

            targetCalories,
            targetProtein,
          },
        });
      }

      return {
        meal,
        totalCalories,
        totalProtein,
      };
    });

    // =========================
    // Response
    // =========================

    return NextResponse.json({
      message: "Meal created successfully",
      aiAnalysis,
      mealId: result.meal.id,
      totalCalories: result.totalCalories,
      totalProtein: result.totalProtein,
      status: 201
    });
  } catch (error) {
    // คืน quota เฉพาะกรณีที่ consume ไปแล้ว
    if (aiQuotaConsumed) {
      await redis.decr(`ai_limit:${userId}`);
    }

    logger.error(
      {
        err: error,
        userId,
      },
      "Meal POST error"
    );

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 503,
      }
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'meals', 100, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { message: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        }
      }
    );
  }
  const session = await getSession();
  const userId = Number(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const year = Number(request.nextUrl.searchParams.get("year"));
  const month = Number(request.nextUrl.searchParams.get("month"));
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ message: "Invalid date parameters" }, { status: 400 });
  }
  // concept
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const summaries = await prisma.dailySummary.findMany({
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
  return NextResponse.json({ summaries }, { status: 200 });
}

