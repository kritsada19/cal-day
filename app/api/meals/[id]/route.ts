import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { mealService } from "@/lib/services/meal.service";

/**
 * DELETE /api/meals/:id — ลบมื้ออาหาร 1 มื้อ
 * (การหักแคลอรีคืนจากสรุปรายวันอยู่ใน meal.service → meal.repository ที่เดียว
 *  ทำให้ไม่ต้องเขียนสูตรคำนวณซ้ำแบบเดิมอีก)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mealId = Number(id);

  // 1) ต้องล็อกอินก่อน
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  try {
    // 2) service ตรวจว่าเป็นมื้อของผู้ใช้คนนี้จริง แล้วลบ + หักยอดออกจากสรุปรายวัน
    await mealService.deleteMeal(mealId, userId);

    return NextResponse.json({ message: "Meal deleted successfully" });
  } catch (error) {
    return errorResponse(error, {
      status: 503,
      message: "Internal server error",
      log: "Meal delete error",
      context: { mealId, userId },
    });
  }
}
