import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/sesstion";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeFood } from "@/lib/services/ai";
import { checkAndComsumeAiQuota } from "@/lib/services/ai-quota";
import { mealSchema } from "@/lib/validation/meal";

export async function POST(request: NextRequest) {
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

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = mealSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const { mealText: rawText, mealType, date: localDateStr } = validation.data;

  const aiAnalysis = await analyzeFood(rawText);

  const userId = Number(session.user.id);
  let startOfDay: Date;
  let endOfDay: Date;

  if (localDateStr) {
    // ถ้ารับมาถูกต้อง เช่น "2026-08-18"
    // เราจับมันประกอบกับเวลา 00:00:00Z และ 23:59:59Z ได้เลย
    startOfDay = new Date(`${localDateStr}T00:00:00.000Z`);
    endOfDay = new Date(`${localDateStr}T23:59:59.999Z`);
  } else {
    // Fallback เผื่อไว้กรณี Client เก่า หรือไม่ได้ส่งมา
    const now = new Date();
    startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 },
    );
  }

  // Check and consume AI quota 
  const quotaResponse = await checkAndComsumeAiQuota(userId, user.subscription?.plan as string);
  if (quotaResponse) return quotaResponse;

  try {
    const { meal, totalCalories, totalProtein } = await prisma.$transaction(async (tx) => {
      const meal = await tx.meal.create({
        data: {
          userId,
          mealType,
        },
      });

      if (aiAnalysis.foods && aiAnalysis.foods.length > 0) {
        await tx.foodEntry.createMany({
          data: aiAnalysis.foods.map((food) => ({
            mealId: meal.id,
            foodName: food.name,
            amount: food.amount || 1,
            unit: food.unit || "serving",
            calories: food.calories || 0,
            protein: food.protein || 0,
          })),
        });
      } else {
        await tx.foodEntry.create({
          data: {
            mealId: meal.id,
            foodName: rawText,
            amount: 1,
            unit: "text",
            calories: aiAnalysis.estimatedCalories || 0,
            protein: aiAnalysis.estimatedProtein || 0,
          },
        });
      }

      const totalCalories = aiAnalysis.estimatedCalories;
      const totalProtein = aiAnalysis.estimatedProtein;

      const profile = await tx.profile.findUnique({ where: { userId } });
      const targetCalories = profile?.targetCalories ?? 0;
      const targetProtein = profile?.targetProtein ?? 0;

      const existingSummary = await tx.dailySummary.findFirst({
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
          where: { id: existingSummary.id },
          data: {
            totalCalories: Number(
              (existingSummary.totalCalories + totalCalories).toFixed(1),
            ),
            totalProtein: Number(
              (existingSummary.totalProtein + totalProtein).toFixed(1),
            ),
            targetCalories: targetCalories,
            targetProtein: targetProtein,
          },
        });
      } else {
        await tx.dailySummary.create({
          data: {
            userId,
            date: startOfDay,
            totalCalories: Number(totalCalories.toFixed(1)),
            totalProtein: Number(totalProtein.toFixed(1)),
            targetCalories: targetCalories,
            targetProtein: targetProtein,
          },
        });
      }

      return { meal, totalCalories, totalProtein };
    });

    return NextResponse.json({
      message: "Meal received and sent to mock AI",
      aiAnalysis,
      mealId: meal.id,
      totalCalories: Number(totalCalories.toFixed(1)),
      totalProtein: Number(totalProtein.toFixed(1)),
    });
  } catch (error) {
    await redis.decr(`ai_limit:${userId}`);

    console.error("Meal POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 503 },
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
