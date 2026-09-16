import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { MealType } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "admin-foods", 100, 60);

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
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";

    // Support filtering by mealType or meal parameter
    const mealParam = (searchParams.get("mealType") || searchParams.get("meal"))?.toUpperCase();

    const where: Prisma.FoodEntryWhereInput = {};

    if (search) {
      where.OR = [
        { foodName: { contains: search, mode: "insensitive" } },
        {
          meal: {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (mealParam && Object.values(MealType).includes(mealParam as MealType)) {
      where.meal = {
        mealType: mealParam as MealType,
      };
    }

    const skip = (page - 1) * limit;

    const [total, foodEntries] = await Promise.all([
      prisma.foodEntry.count({ where }),
      prisma.foodEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          meal: {
            select: {
              id: true,
              mealType: true,
              createdAt: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      foodEntries,
      foods: foodEntries, // provided for compatibility with different frontend conventions
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Admin foods GET error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
