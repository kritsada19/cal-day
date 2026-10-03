import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http";
import { mealSchema } from "@/lib/validation/meal";
import { mealService } from "@/lib/services/meal.service";
import { publishMealEvent } from "@/lib/realtime/publisher";

/**
 * route handler = "พนักงานต้อนรับ" ของร้านอาหาร
 * หน้าที่มีแค่: รับ request → ตรวจ rate limit / session / ข้อมูล → เรียก service → ตอบกลับ
 * ส่วนกฎธุรกิจทั้งหมดอยู่ใน lib/services/meal.service.ts
 */

/**
 * POST /api/meals — บันทึกมื้ออาหาร 1 มื้อ
 */
export async function POST(request: NextRequest) {
  // 1) จำกัดจำนวนครั้งที่เรียกต่อ IP (100 ครั้ง / 60 วินาที)
  const rateLimit = await checkRateLimit(request, "meals", 100, 60);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  // 2) ต้องล็อกอินก่อน
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  // 3) ตรวจรูปแบบข้อมูลที่ส่งมา (mealText / mealType / date)
  const body = await request.json();
  const validation = mealSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  try {
    // 4) งานทั้งหมดเป็นของ service — บรรทัดเดียวจบ
    const result = await mealService.createMeal(userId, validation.data);

    // 5) ตอบกลับผลลัพธ์
    return NextResponse.json(
      {
        message: "Meal analysis queued",
        jobId: result.jobId,
      },
      { status: 202 },
    );
  } catch (error) {
    return errorResponse(error, {
      status: 503,
      message: "Internal server error",
      log: "Meal POST error",
      context: { userId },
    });
  }
}

/**
 * GET /api/meals?year=2026&month=8 — ดึงสรุปรายวันของเดือนนั้น (ใช้ทำปฏิทิน)
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

  // 3) อ่านพารามิเตอร์จาก URL
  const year = Number(request.nextUrl.searchParams.get("year"));
  const month = Number(request.nextUrl.searchParams.get("month"));

  try {
    // 4) service เป็นคนตรวจค่าที่ส่งมา + จัดการ cache ให้
    const summaries = await mealService.getMonthlySummaries(userId, year, month);

    return NextResponse.json({ summaries }, { status: 200 });
  } catch (error) {
    return errorResponse(error, {
      status: 500,
      message: "Internal server error",
      log: "Meals GET error",
      context: { userId, year, month },
    });
  }
}
