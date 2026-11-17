import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validation/auth";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sendVerificationEmail } from "@/lib/email/sendEmail";
import crypto from "crypto";
import { env } from "@/lib/env";

// นี่คือ Dummy Hash ระดับ 12 Rounds (สังเกตตรง $2a$12$) เพื่อให้หน่วงเวลาเท่ากับตอนสร้าง User 
const DUMMY_HASH_12 = "$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimitPolicy(req, "signup");

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
    const locale = typeof body === "object" && body && "locale" in body && typeof body.locale === "string"
      ? body.locale
      : req.headers.get("x-locale") || "en";

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // กรณีที่ 1: บัญชีนี้เคยยืนยันอีเมลเรียบร้อยแล้ว (Verified)
    // ไม่อนุญาตให้สมัครซ้ำ ให้ตอบ 409 เพื่อให้ไปหน้า Sign in
    if (existingUser && existingUser.emailVerified) {
      await bcrypt.compare(password, DUMMY_HASH_12);

      return NextResponse.json(
        { message: "An account with this email already exists. You can log in instead." },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // กรณีที่ 2: บัญชีเคยสมัครไว้แต่ "ยังไม่เคยยืนยันอีเมล" (เช่น Token หมดอายุ หรือเพิ่งมากรอกสมัครใหม่)
    // ให้อัปเดตข้อมูล (ชื่อ + รหัสผ่านใหม่) แทนการสร้าง User ซ้ำ
    if (existingUser && !existingUser.emailVerified) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim(),
          password: hashedPassword,
        },
      });
    } else {
      // กรณีที่ 3: ผู้ใช้ใหม่ที่ยังไม่เคยมีในระบบเลย
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
    }

    // ลบ Token ยืนยันอีเมลเดิมที่อาจค้างอยู่หรือหมดอายุ
    await prisma.verificationToken.deleteMany({
      where: {
        email: email.toLowerCase(),
        type: "EMAIL_VERIFY",
      },
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.verificationToken.create({
      data: {
        email: email.toLowerCase(),
        token: verificationToken,
        type: "EMAIL_VERIFY",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expire in 1 Hour
      },
    });

    const verificationLink = `${env.NEXTAUTH_URL}/api/auth/email-verify?token=${verificationToken}`;

    await sendVerificationEmail(email, verificationLink, locale === "th" ? "th" : "en");

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logger.error({ err: error }, "Error creating user");
    return NextResponse.json(
      { message: "We could not create your account right now" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
