import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/access";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http";
import { mealService } from "@/lib/services/meal.service";

/**
 * GET /api/meals/daily?date=2026-08-26 — ดึงมื้ออาหารทั้งหมดของวันนั้น
 * (เดิม route นี้มี query + cache + date logic ซ้ำกับ meals/route.ts ตอนนี้ย้ายไป service หมดแล้ว)
 */
export async function GET(request: NextRequest) {
  // 1) จำกัดจำนวนครั้งที่เรียกต่อ IP
  const rateLimit = await checkRateLimitPolicy(request, "meals");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  // 2) ต้องล็อกอินก่อน
  const auth = await requireAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const userId = Number(auth.session.user.id);

  // 3) อ่านวันที่จาก URL (รูปแบบ YYYY-MM-DD) และ timezone offset (นาที)
  const date = request.nextUrl.searchParams.get("date");
  const tzOffset = parseInt(request.nextUrl.searchParams.get("timezone") ?? "0", 10);

  try {
    // 4) service ตรวจวันที่ + จัดการ cache + ดึงข้อมูลให้
    const meals = await mealService.getDailyMeals(userId, date, isNaN(tzOffset) ? 0 : tzOffset);

    return NextResponse.json({ meals }, { status: 200 });
  } catch (error) {
    return errorResponse(error, {
      status: 500,
      message: "Internal server error",
      log: "Daily meals GET error",
      context: { userId, date },
    });
  }
}
