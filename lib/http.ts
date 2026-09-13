import { NextResponse } from "next/server";
import { logger } from "./logger";
import type { RateLimitResult } from "./rate-limit";
import { isAppError } from "./services/errors";

/**
 * ไฟล์นี้เป็น "ตัวช่วยของชั้น HTTP"
 * รวมการสร้าง response ที่ซ้ำ ๆ กันในทุก route (เช่น 429 ของ rate limit และการแปลง error)
 * เพื่อให้ route handler สั้น อ่านง่าย และมีรูปแบบตอบกลับเหมือนกันทุก endpoint
 */

/** ตอบกลับ 429 พร้อม header บอกโควต้าที่เหลืออยู่ */
export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { message: "Rate limit exceeded. Please try again later." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
      },
    },
  );
}

type ErrorResponseOptions = {
  /** HTTP status ที่ใช้เมื่อเป็นข้อผิดพลาดที่ไม่คาดคิด (ไม่ใช่ AppError) */
  status: number;
  /** ข้อความที่ส่งให้ผู้ใช้เมื่อเป็นข้อผิดพลาดที่ไม่คาดคิด */
  message: string;
  /** ข้อความสำหรับเขียน log */
  log: string;
  /** ข้อมูลเพิ่มเติมที่อยากเห็นใน log เช่น userId / mealId */
  context?: Record<string, unknown>;
};

/**
 * แปลง error ที่หลุดมาจาก service ให้เป็น HTTP response
 * - AppError = ข้อผิดพลาดที่เราตั้งใจสร้าง (มี status/message พร้อมใช้) → ส่งกลับตามนั้น
 * - error อื่น ๆ = ข้อผิดพลาดที่ไม่ได้คาดคิด → log ไว้ดู แล้วตอบ fallback
 */
export function errorResponse(error: unknown, options: ErrorResponseOptions) {
  if (isAppError(error)) {
    // AppError = เรื่องที่คาดไว้ได้ (ข้อมูลผิด / ไม่พบข้อมูล / เกินโควต้า)
    // จึงใช้ warn เพื่อไม่ให้ log เต็มไปด้วย error ที่ไม่ใช่ความผิดของระบบ
    logger.warn({ ...options.context, status: error.status }, options.log);
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  // error ที่ไม่คาดคิด → ต้องมี stack ไว้ให้ตามหาสาเหตุ
  logger.error({ err: error, ...options.context }, options.log);

  return NextResponse.json(
    { message: options.message },
    { status: options.status },
  );
}
