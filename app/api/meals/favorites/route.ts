import { NextRequest, NextResponse } from "next/server";
import { requirePro } from "@/lib/auth/access";
import { favoriteService } from "@/lib/services/favorite.service";
import { mealService } from "@/lib/services/meal.service";
import { favoriteMealCreateSchema } from "@/lib/validation/meal";
import { publishMealEvent } from "@/lib/realtime/publisher";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http/http";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(request, "meals");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const auth = await requirePro(request);
  if (!auth.ok) {
    return auth.response;
  }

  const userId = Number(auth.session.user.id);

  try {
    const favorites = await favoriteService.getUserFavorites(userId);
    return NextResponse.json(favorites);
  } catch (error) {
    return errorResponse(error, {
      status: 500,
      message: "Failed to fetch favorite meals",
      log: "Failed to fetch favorite meals",
      context: { userId },
    });
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimitPolicy(request, "meals");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const auth = await requirePro(request);
  if (!auth.ok) {
    return auth.response;
  }

  const userId = Number(auth.session.user.id);

  const body = await request.json();
  const validation = favoriteMealCreateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const result = await mealService.createMealFromFavorite(userId, validation.data);

    // ส่ง Event ผ่าน SSE / Redis
    await publishMealEvent({
      type: "meal.created",
      userId: String(userId),
    });

    return NextResponse.json({
      message: "Meal created from favorite successfully",
      mealId: result.mealId,
      totalCalories: result.totalCalories,
      totalProtein: result.totalProtein,
      status: 201,
    });
  } catch (error) {
    return errorResponse(error, {
      status: 500,
      message: "Failed to create meal from favorite",
      log: "Favorite Meal POST error",
      context: { userId },
    });
  }
}


