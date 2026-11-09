import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/access";
import prisma from "@/lib/db/prisma";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { logAdminAction, getClientContext } from "@/lib/audit";
import { MealType } from "@/app/generated/prisma/enums";
import { deleteUserCache } from "@/lib/cache";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetUserId = parseInt(id, 10);

  if (isNaN(targetUserId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const rateLimit = await checkRateLimitPolicy(request, "adminUserDetail");

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  const session = auth.session;

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            startAt: true,
            endAt: true,
          },
        },
        profile: {
          select: {
            gender: true,
            age: true,
            weight: true,
            height: true,
            exerciseLevel: true,
            goal: true,
            bmr: true,
            tdee: true,
            targetCalories: true,
            targetProtein: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const mealParam = (searchParams.get("mealType") || searchParams.get("meal"))?.toUpperCase();

    const foodWhere: Prisma.FoodEntryWhereInput = {
      meal: {
        userId: targetUserId,
      },
    };

    if (mealParam && Object.values(MealType).includes(mealParam as MealType)) {
      foodWhere.meal = {
        mealType: mealParam as MealType,
      };
    }

    if (search) {
      foodWhere.foodName = { contains: search, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [totalFoodEntries, foodEntries] = await Promise.all([
      prisma.foodEntry.count({ where: foodWhere }),
      prisma.foodEntry.findMany({
        where: foodWhere,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        select: {
          id: true,
          mealId: true,
          foodName: true,
          amount: true,
          unit: true,
          calories: true,
          protein: true,
          meal: {
            select: {
              id: true,
              mealType: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalFoodEntries / limit);

    return NextResponse.json({
      user,
      foodEntries,
      foods: foodEntries,
      pagination: {
        total: totalFoodEntries,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    logger.error({ err: error, targetUserId, adminId: session.user.id }, "Admin user detail GET error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetUserId = parseInt(id, 10);

  if (isNaN(targetUserId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const rateLimit = await checkRateLimitPolicy(request, "adminUserDelete");

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  const session = auth.session;

  if (targetUserId === Number(session.user.id)) {
    return NextResponse.json(
      { message: "Cannot delete your own admin account" },
      { status: 400 }
    );
  }

  const { ip, userAgent, route } = getClientContext(request);

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    logAdminAction({
      action: "user.delete",
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetType: "user",
      targetId: targetUserId,
      route,
      ip,
      userAgent,
      status: "success",
      changes: {
        before: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
        after: null, // ถูกลบออกจากระบบแล้ว
      },
    });

    await deleteUserCache(targetUserId);

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    logAdminAction({
      action: "user.delete",
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetType: "user",
      targetId: targetUserId,
      route,
      ip,
      userAgent,
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown error",
    });

    logger.error({ err: error, targetUserId, adminId: session.user.id }, "Admin user DELETE error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

