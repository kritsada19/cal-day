import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http";
import { imageMealSchema } from "@/lib/validation/meal";
import { mealService } from "@/lib/services/meal.service";
import { publishMealEvent } from "@/lib/realtime/publisher";

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "meals-image", 20, 60);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const body = await request.json();
  const validation = imageMealSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const result = await mealService.createMealFromImage(userId, validation.data);

    await publishMealEvent({
      type: "meal.created",
      userId: String(userId),
    });

    return NextResponse.json({
      message: "Meal image analyzed and saved successfully",
      aiAnalysis: result.aiAnalysis,
      mealId: result.mealId,
      totalCalories: result.totalCalories,
      totalProtein: result.totalProtein,
      status: 201,
    });
  } catch (error) {
    return errorResponse(error, {
      status: 503,
      message: "Internal server error during image analysis",
      log: "Meal image POST error",
      context: { userId },
    });
  }
}
