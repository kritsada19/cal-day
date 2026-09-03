import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";

// Prisma PostgreSQL adapter และ ioredis ต้องทำงานบน Node.js runtime
export const runtime = "nodejs";

// ปิดการ Cache
// Health Check ต้องการข้อมูล สถานะล่าสุดจริง ๆ
export const dynamic = "force-dynamic";

// กำหนดเวลา timeout = 3,000 milliseconds
const HEALTH_CHECK_TIMEOUT_MS = 3_000;

/**
 * ตรวจสอบการเชื่อมต่อของบริการพร้อมกำหนดเวลา เพื่อป้องกันไม่ให้
 * endpoint รออย่างไม่มีกำหนดเมื่อบริการนั้นไม่พร้อมใช้งาน
 */
function checkConnection(check: () => Promise<unknown>): Promise<"up" | "down"> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve("down"), HEALTH_CHECK_TIMEOUT_MS);

    void check().then(
      () => {
        clearTimeout(timeout);
        resolve("up");
      },
      () => {
        clearTimeout(timeout);
        resolve("down");
      }
    );
  });
}

/**
 * รายงานว่าแอปพลิเคชันเชื่อมต่อกับบริการข้อมูลที่จำเป็นได้หรือไม่
 * สถานะ 503 ช่วยให้ load balancer และระบบมอนิเตอร์ระบุได้ว่า instance นี้
 * ไม่พร้อมใช้งาน โดยไม่เปิดเผยรายละเอียดข้อผิดพลาดภายใน
 */
export async function GET() {
  // ตรวจสอบทั้งสองบริการพร้อมกัน เพื่อให้ endpoint ตอบสนองได้รวดเร็ว
  const [database, redisStatus] = await Promise.all([
    checkConnection(() => prisma.$queryRaw`SELECT 1`),
    checkConnection(() => redis.ping()),
  ]);

  const healthy = database === "up" && redisStatus === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "unhealthy",
      database,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
