import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http";
import { mealService } from "@/lib/services/meal.service";

/**
 * GET /api/meals/daily?date=2026-08-26 — ดึงมื้ออาหารทั้งหมดของวันนั้น
 * (เดิม route นี้มี query + cache + date logic ซ้ำกับ meals/route.ts ตอนนี้ย้ายไป service หมดแล้ว)
 */
export async function GET(request: NextRequest) {
  // 1) จำกัดจำนวนครั้งที่เรียกต่อ IP
  const rateLimit = await checkRateLimit(request, "meals", 100, 60);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  // 2) ต้องล็อกอินก่อน
  const session = await getSession();
  const userId = Number(session?.user?.id);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 3) อ่านวันที่จาก URL (รูปแบบ YYYY-MM-DD)
  const date = request.nextUrl.searchParams.get("date");

  try {
    // 4) service ตรวจวันที่ + จัดการ cache + ดึงข้อมูลให้
    const meals = await mealService.getDailyMeals(userId, date);

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
