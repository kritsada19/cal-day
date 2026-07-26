import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/sesstion";
import prisma from "@/lib/db/prisma";

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

export async function POST(request: Request) {
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
