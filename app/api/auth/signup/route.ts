import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validation/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// นี่คือ Dummy Hash ระดับ 12 Rounds (สังเกตตรง $2a$12$) เพื่อให้หน่วงเวลาเท่ากับตอนสร้าง User 
const DUMMY_HASH_12 = "";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(req, "signup", 20, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        { message: "Too many signup attempts. Please try again in a minute." },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      // ปล่อยให้ Zod เป็นคนเตือนเรื่องข้อมูลขาดหายเอง
    }

    // โยน body ให้ Zod จัดการ Validate ทั้งหมด (รวมเช็ค Password ตรงกัน)
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      // ดึง Error Message ตัวแรกมาแสดง
      return NextResponse.json(
        { message: validationResult.error.issues[0].message },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { name, email, password } = validationResult.data; // ได้ Data ที่ผ่านการ Clean & Type Check แล้ว

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (existingUser) {
      // ถ่วงเวลาด้วย Dummy Hash ระดับ 12 ให้เท่ากับตอนสร้างปกติ (Timing Attack Mitigation)
      await bcrypt.compare(password, DUMMY_HASH_12);

      return NextResponse.json(
        { message: "If this account already exists, you can log in instead" },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,

        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "We could not create your account right now" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
