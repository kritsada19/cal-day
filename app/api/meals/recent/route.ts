import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { mealRepository } from "@/lib/repositories/meal.repository";

/**
 * GET /api/meals/recent
 *
 * คืน array ของชื่ออาหารล่าสุด (ไม่ซ้ำ) ของ user ที่ล็อกอินอยู่
 * ใช้สำหรับแสดงเป็น "shortcut chip" บนหน้าบันทึกมื้ออาหาร
 * เพื่อให้ผู้ใช้กดเลือกได้เลยโดยไม่ต้องพิมพ์ใหม่
 *
 * Response: { recentMeals: string[] }
 */
export async function GET() {
  // ตรวจสอบว่าล็อกอินอยู่ก่อน
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  // ดึง 3 ชื่ออาหารล่าสุด (distinct) ของ user คนนี้
  const recentMeals = await mealRepository.getRecentMealTexts(userId, 3);

  return NextResponse.json({ recentMeals }, { status: 200 });
}
