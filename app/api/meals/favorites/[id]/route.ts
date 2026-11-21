import { NextRequest, NextResponse } from "next/server";
import { requirePro } from "@/lib/auth/access";
import { favoriteService } from "@/lib/services/favorite.service";
import { favoriteMealUpdateSchema } from "@/lib/validation/meal";
import { publishFavoriteEvent } from "@/lib/realtime/publisher";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const favoriteId = Number(id);

  if (isNaN(favoriteId) || favoriteId <= 0) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

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
  const validation = favoriteMealUpdateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const updated = await favoriteService.updateFavoriteMeal(userId, {
      favoriteId,
      amount: validation.data.amount,
      unit: validation.data.unit,
    });

    // ยิง event ไปยัง pub-sub ของ favorites
    await publishFavoriteEvent({
      type: "favorite.updated",
      userId: String(userId),
      favoriteId: updated.id,
    });

    return NextResponse.json({
      message: "Favorite meal updated successfully",
      favorite: updated,
    });
  } catch (error) {
    return errorResponse(error, {
      status: 500,
      message: "Failed to update favorite meal",
      log: "Favorite Meal PUT error",
      context: { favoriteId, userId },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const favoriteId = Number(id);

  if (isNaN(favoriteId) || favoriteId <= 0) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

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
    const deleted = await favoriteService.deleteFavoriteMeal(userId, favoriteId);

    // ยิง event แจ้งเตือนลบ
    await publishFavoriteEvent({
      type: "favorite.deleted",
      userId: String(userId),
      favoriteId: deleted.id,
    });

    return NextResponse.json({
      message: "Favorite meal deleted successfully",
      favoriteId: deleted.id,
    });
  } catch (error) {
    return errorResponse(error, {
      status: 500,
      message: "Failed to delete favorite meal",
      log: "Favorite Meal DELETE error",
      context: { favoriteId, userId },
    });
  }
}

