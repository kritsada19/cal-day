"use client"; // ต้องเป็น Client Component เสมอ เพราะ Error Boundary ใช้ React state ในการ catch error

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * AnalyticsError — Error Boundary สำหรับ /analytics
 *
 * จะถูก render แทนที่ page.tsx เมื่อเกิด runtime error ใน /analytics segment
 * เหมาะสำหรับ catch error จากการ fetch ข้อมูลกราฟหรือการคำนวณสถิติที่ล้มเหลว
 *
 * Props ที่ Next.js ส่งมาให้:
 *   - error   : Error object ที่ถูก throw
 *   - reset   : ฟังก์ชันสำหรับ re-render segment นี้ใหม่โดยไม่ reload หน้า
 */
export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error ไปยัง console (หรือ error tracking service เช่น Sentry)
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "Analytics error boundary triggered");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Icon แสดงสถานะ error — ใช้ chart icon เพราะเกี่ยวข้องกับ analytics */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
      </div>

      {/* ข้อความแจ้ง error */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          โหลดข้อมูลสถิติไม่ได้
        </h2>
        <p className="max-w-md text-muted-foreground">
          เกิดข้อผิดพลาดขณะโหลดข้อมูล Analytics
          อาจเกิดจากปัญหาชั่วคราวของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง
        </p>

        {/* แสดง error digest เฉพาะ development mode เพื่อช่วย debug */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* ปุ่ม retry — เรียก reset() เพื่อให้ Next.js ลอง render segment ใหม่ */}
      <button
        onClick={reset}
        className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
