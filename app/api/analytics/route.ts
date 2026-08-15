import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(request, "analytics", 10, 60);

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

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7", 10);

  try {
    const userId = Number(session.user.id);
    const now = new Date();
    
    // Calculate start date
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Fetch daily summaries
    const summaries = await prisma.dailySummary.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        date: 'asc',
      }
    });

    // We also need the user's profile to know their current targets if a day is missing
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    const targetCal = profile?.targetCalories || 2000;
    const targetPro = profile?.tragetProtein || 100;

    // Build the weekly data array, filling in missing days
    const weeklyData = [];
    let totalCal = 0;
    let daysOnTarget = 0;
    let currentStreak = 0;
    
    // Create an array of active days for streak calculation
    const activeDays = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Format day name (e.g., "Mon", "Tue")
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Find summary for this date
      const summaryForDate = summaries.find(
        s => new Date(s.date).toDateString() === currentDate.toDateString()
      );

      const calories = summaryForDate?.totalCalories || 0;
      const protein = summaryForDate?.totalProtein || 0;
      const dayTargetCal = summaryForDate?.tragetCalories || targetCal;
      const dayTargetPro = summaryForDate?.tragetProtein || targetPro;

      weeklyData.push({
        day: dayName,
        date: currentDate.toISOString(),
        calories,
        targetCal: dayTargetCal,
        protein,
        targetPro: dayTargetPro,
      });

      totalCal += calories;

      // Logic for On Target (within 10% of target or hit exactly)
      // For simplicity, let's say they hit the target if they are within 100 kcal of it, or under if goal is lose weight
      const isHit = calories > 0 && calories <= dayTargetCal + 100; 
      activeDays.push(isHit);

      if (isHit) {
        daysOnTarget++;
        currentStreak++;
      } else if (calories > 0 || currentDate.toDateString() !== now.toDateString()) {
         // Reset streak if missed a past day or logged over
        currentStreak = 0;
      }
    }

    const averageCalories = Math.round(totalCal / days);
    const consistencyScore = Math.round((daysOnTarget / days) * 100);

    return NextResponse.json({
      weeklyData,
      stats: {
        averageCalories,
        consistencyScore,
        currentStreak,
        activeDays,
        targetCal
      }
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ message: "Database unavailable" }, { status: 503 });
  }
}
