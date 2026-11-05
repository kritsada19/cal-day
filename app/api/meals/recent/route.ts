import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/access";
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
  const auth = await requireAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const userId = Number(auth.session.user.id);

  // ดึง 3 ชื่ออาหารล่าสุด (distinct) ของ user คนนี้
  const recentMeals = await mealRepository.getRecentMealTexts(userId, 3);

  return NextResponse.json({ recentMeals }, { status: 200 });
}
