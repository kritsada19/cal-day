import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { buildProfileNutritionSummary, calculateDailyNutritionTargets } from "@/lib/nutrition";
import { getUserAiQuota } from "@/lib/services/ai-quota";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'profile', 100, 60);

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

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      include: {
        subscription: true,
        profile: true,
      }
    });

    const aiQuota = await getUserAiQuota(Number(session.user.id), user?.subscription?.plan);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dailySummary = await prisma.dailySummary.findFirst({
      where: {
        userId: Number(session.user.id),
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const summary = buildProfileNutritionSummary(
      user?.profile,
      dailySummary?.totalCalories ?? 0,
      dailySummary?.totalProtein ?? 0
    );

    return NextResponse.json({
      ...user,
      ...summary,
      aiUsage: aiQuota.usage,
      aiLimit: aiQuota.limit,
      aiRemaining: aiQuota.remaining
    });
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Profile GET error");
    return NextResponse.json({ message: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(request, 'profile', 100, 60);

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
  const { gender, age, weight, height, exerciseLevel, goal } = body;

  if (!gender || !age || !weight || !height || !exerciseLevel || !goal) {
    return NextResponse.json(
      { message: "Please complete all personal information fields" },
      { status: 400 }
    );
  }

  const profileData = {
    gender,
    age: Number(age),
    weight: Number(weight),
    height: Number(height),
    exerciseLevel,
    goal,
  };

  const nutritionTargets = calculateDailyNutritionTargets(profileData);

  if (!nutritionTargets) {
    return NextResponse.json(
      { message: "Unable to calculate nutrition targets from the provided profile" },
      { status: 400 }
    );
  }

  const profilePayload = {
    ...profileData,
    bmr: nutritionTargets.bmr,
    tdee: nutritionTargets.tdee,
    targetCalories: nutritionTargets.calories,
    targetProtein: nutritionTargets.protein,
  };

  try {
    const userId = Number(session.user.id);
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    const profile = existingProfile
      ? await prisma.profile.update({
        where: { userId },
        data: profilePayload,
      })
      : await prisma.profile.create({
        data: {
          userId,
          ...profilePayload,
        },
      });

    const summary = buildProfileNutritionSummary(profile, 0, 0);

    return NextResponse.json({ profile, ...summary, message: "Profile saved successfully" });
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Profile POST error");
    return NextResponse.json({ message: "Database unavailable" }, { status: 503 });
  }
}
