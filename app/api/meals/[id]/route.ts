import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { deleteUserCache } from "@/lib/cache";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;
    const mealId = Number(id);

    if (!session?.user?.id) {
      logger.error({ session }, "Unauthorized");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    const isMealOwner = await prisma.meal.findFirst({
      where: {
        id: mealId,
        userId: userId,
      },
    });

    if (!isMealOwner) {
      logger.error({ mealId, userId }, "Meal not found or unauthorized");
      return NextResponse.json(
        { message: "Meal not found or unauthorized" },
        { status: 404 },
      );
    }

    // recalculate dailySummary of the day before meal deleted
    const meal = await prisma.meal.findUnique({
      where: {
        id: mealId,
      },
      include: {
        foodEntries: true,
      }
    });

    if (!meal) {
      return NextResponse.json(
        { message: "Meal not found" },
        { status: 404 },
      );
    }

    const dailySummary = await prisma.dailySummary.findFirst({
      where: {
        userId: userId,
        date: meal.createdAt
      },
    });

    if (!dailySummary) {
      return NextResponse.json(
        { message: "Daily summary not found" },
        { status: 404 },
      );
    }

    const updatedDailySummary = {
      ...dailySummary,
      totalCalories: dailySummary.totalCalories - meal.foodEntries.reduce((acc, foodEntry) => acc + foodEntry.calories, 0),
      totalProtein: dailySummary.totalProtein - meal.foodEntries.reduce((acc, foodEntry) => acc + foodEntry.protein, 0)
    };

    await prisma.$transaction([
      prisma.dailySummary.update({
        where: { id: dailySummary.id },
        data: updatedDailySummary,
      }),
      prisma.meal.delete({
        where: { id: mealId },
      }),
    ]);

    await deleteUserCache(userId);

    return NextResponse.json({ message: "Meal deleted successfully" });
  } catch (error) {
    logger.error({ error }, "Meal delete error");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 503 },
    );
  }
}
