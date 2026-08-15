import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/sesstion";
import prisma from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit(request, 'meals', 10, 60);

    if (!rateLimit.success) {
        return NextResponse.json(
            { message: "Rate limit exceeded. Please try again later." },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': rateLimit.limit.toString(),
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                }
            }
        );
    }

    // 1. ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
    const session = await getSession();
    const userId = Number(session?.user?.id);

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. รับพารามิเตอร์ date จาก URL (เช่น ?date=2024-03-01)
        const dateParam = request.nextUrl.searchParams.get("date");

        if (!dateParam) {
            return NextResponse.json({ message: "Date is required" }, { status: 400 });
        }

        // 2. แปลงข้อความวันที่ให้เป็น Object Date และเช็คว่าวันที่ถูกต้องไหม
        const targetDate = new Date(dateParam);
        if (isNaN(targetDate.getTime())) {
            return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
        }

        // 3. ตั้งค่าเวลาเริ่มต้นของวัน (00:00:00) และเวลาสิ้นสุดของวัน (23:59:59)
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 4. ค้นหามื้ออาหารทั้งหมดของ user ในวันนั้น พร้อมดึงรายการอาหาร (foodEntries) มาด้วย
        const meals = await prisma.meal.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startOfDay, // มากกว่าหรือเท่ากับตอนเริ่มวัน
                    lte: endOfDay,   // น้อยกว่าหรือเท่ากับตอนจบวัน
                },
            },
            include: {
                foodEntries: true, // ดึงข้อมูลอาหารที่อยู่ในมื้อนั้นๆ มาด้วย
            },
            orderBy: {
                createdAt: "asc", // เรียงลำดับตามเวลาที่บันทึก (เก่าไปใหม่)
            },
        });

        // 5. ส่งข้อมูลกลับไปให้ Frontend
        return NextResponse.json({ meals }, { status: 200 });

    } catch (error) {
        console.error("Daily meals GET error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: String(error) },
            { status: 500 }
        );
    }

}
