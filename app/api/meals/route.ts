import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/sesstion";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";
import { AI_LIMIT_FREE } from "@/lib/services/ai-quota";
import { AI_LIMIT_PRO } from "@/lib/services/ai-quota";
import { checkRateLimit } from "@/lib/rate-limit";

type MealTypeValue = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

type MockAiAnalysis = {
  summary: string;
  estimatedCalories: number;
  estimatedProtein: number;
  note: string;
};

function normalizeMealType(value: string | undefined): MealTypeValue {
  if (
    value === "BREAKFAST" ||
    value === "LUNCH" ||
    value === "DINNER" ||
    value === "SNACK"
  ) {
    return value;
  }

  return "SNACK";
}

function mockAiAnalyzeMeal(mealText: string): MockAiAnalysis {
  const cleanedText = mealText.trim();

  return {
    summary: `Mock AI received: ${cleanedText}`,
    estimatedCalories: 300,
    estimatedProtein: 15,
    note: "This is a temporary mock analysis. Real AI integration can replace it later.",
  };
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'meals', 10, 60);

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
  const rawText = typeof body?.mealText === "string" ? body.mealText : "";
  const mealType = normalizeMealType(
    typeof body?.mealType === "string" ? body.mealType : undefined,
  );

  if (!rawText.trim()) {
    return NextResponse.json(
      { message: "Please describe the food you ate" },
      { status: 400 },
    );
  }

  const aiAnalysis = mockAiAnalyzeMeal(rawText);
  const userId = Number(session.user.id);
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

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

  const AI_RATE_LIMIT_KEY = `ai_limit:${userId}`;
  const currentCount = await redis.incr(AI_RATE_LIMIT_KEY);

  if (currentCount === 1) {
    await redis.expire(AI_RATE_LIMIT_KEY, 60 * 60 * 24);
  }

  const isFreePlan = !user.subscription || user.subscription.plan === "FREE";
  const isProPlan = user.subscription?.plan === "PRO";

  if (isFreePlan && currentCount > AI_LIMIT_FREE) {
    return NextResponse.json(
      { message: "AI limit reached. Please upgrade to premium to continue." },
      { status: 429 },
    );
  }

  if (isProPlan && currentCount > AI_LIMIT_PRO) {
    return NextResponse.json(
      { message: "Pro AI limit reached. Please contact support for assistance." },
      { status: 429 },
    );
  }

  try {
    const meal = await prisma.meal.create({
      data: {
        userId,
        mealType,
      },
    });

    await prisma.foodEntry.create({
      data: {
        mealId: meal.id,
        foodName: rawText,
        amount: 1,
        unit: "text",
        calories: aiAnalysis.estimatedCalories,
        protein: aiAnalysis.estimatedProtein,
      },
    });

    const totalCalories = aiAnalysis.estimatedCalories;
    const totalProtein = aiAnalysis.estimatedProtein;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const targetCalories = profile?.targetCalories ?? 0;
    const targetProtein = profile?.tragetProtein ?? 0;

    const existingSummary = await prisma.dailySummary.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (existingSummary) {
      await prisma.dailySummary.update({
        where: { id: existingSummary.id },
        data: {
          totalCalories: Number(
            (existingSummary.totalCalories + totalCalories).toFixed(1),
          ),
          totalProtein: Number(
            (existingSummary.totalProtein + totalProtein).toFixed(1),
          ),
          tragetCalories: targetCalories,
          tragetProtein: targetProtein,
        },
      });
    } else {
      await prisma.dailySummary.create({
        data: {
          userId,
          date: startOfDay,
          totalCalories: Number(totalCalories.toFixed(1)),
          totalProtein: Number(totalProtein.toFixed(1)),
          tragetCalories: targetCalories,
          tragetProtein: targetProtein,
        },
      });
    }

    return NextResponse.json({
      message: "Meal received and sent to mock AI",
      aiAnalysis,
      mealId: meal.id,
      totalCalories: Number(totalCalories.toFixed(1)),
      totalProtein: Number(totalProtein.toFixed(1)),
    });
  } catch (error) {
    if (currentCount <= AI_LIMIT_FREE) {
      await redis.decr(AI_RATE_LIMIT_KEY);
    }

    console.error("Meal POST error:", error);
    return NextResponse.json(
      { message: "Database unavailable", error: String(error) },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
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
