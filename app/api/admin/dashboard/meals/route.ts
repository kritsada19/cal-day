import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "admin-dashboard", 100, 60);

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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [todayCount, past7DaysCount, totalCount] = await Promise.all([
      prisma.meal.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.meal.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.meal.count(),
    ]);

    return NextResponse.json({
      today: todayCount,
      past7Days: past7DaysCount,
      total: totalCount,
    });
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Admin dashboard meals GET error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
