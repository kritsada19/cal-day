"use client"; // ต้องเป็น Client Component เสมอ เพราะ Error Boundary ใช้ React state ในการ catch error

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * DashboardError — Error Boundary สำหรับ /dashboard
 *
 * Next.js App Router จะ render ไฟล์นี้แทนที่ page.tsx โดยอัตโนมัติ
 * เมื่อเกิด runtime error ใน segment นี้หรือ children ของมัน
 *
 * Props ที่ Next.js ส่งมาให้:
 *   - error   : Error object ที่ถูก throw (อาจมี error.digest สำหรับ server error)
 *   - reset   : ฟังก์ชันสำหรับลอง re-render segment นี้ใหม่อีกครั้ง
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error ไปยัง error-reporting service (เช่น Sentry) เมื่อ component mount
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "Dashboard error boundary triggered");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Icon แสดงสถานะ error */}
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
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* ข้อความแจ้ง error */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Dashboard ขัดข้อง
        </h2>
        <p className="max-w-md text-muted-foreground">
          เกิดข้อผิดพลาดขณะโหลด Dashboard กรุณาลองใหม่อีกครั้ง
          หากปัญหายังคงอยู่โปรดติดต่อทีมสนับสนุน
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
