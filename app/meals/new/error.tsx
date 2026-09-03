"use client"; // ต้องเป็น Client Component เสมอ เพราะ Error Boundary ใช้ React state ในการ catch error

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * MealsNewError — Error Boundary สำหรับ /meals/new
 *
 * จะถูก render แทนที่ page.tsx เมื่อเกิด runtime error ใน /meals/new segment
 * ครอบคลุม error ที่เกิดจาก form submission, image upload, หรือการเชื่อมต่อ API
 *
 * หมายเหตุ: Error Boundary นี้อยู่ใน /meals/new ไม่ใช่ /meals
 * เพราะ /meals ไม่มี page.tsx ของตัวเอง (มีแค่ /meals/new)
 * ถ้าต้องการ catch error สำหรับทุก route ภายใต้ /meals ให้ย้ายไปที่ /meals/error.tsx แทน
 *
 * Props ที่ Next.js ส่งมาให้:
 *   - error   : Error object ที่ถูก throw
 *   - reset   : ฟังก์ชันสำหรับ re-render segment นี้ใหม่โดยไม่ reload หน้า
 */
export default function MealsNewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error ไปยัง console — ควรใช้ error tracking service ใน production
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "New meal error boundary triggered");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Icon แสดงสถานะ error — ใช้ fork & knife icon เพราะเกี่ยวข้องกับ meals */}
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
            d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.049 1.837 2.127v1.001c0 1.27-.74 2.46-1.91 2.845a48.167 48.167 0 0 1-12.34 0C4.74 19.475 4 18.285 4 17.015v-1c0-1.078.768-1.968 1.837-2.127a49.101 49.101 0 0 1 1.163-.16"
          />
        </svg>
      </div>

      {/* ข้อความแจ้ง error */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          ไม่สามารถโหลดฟอร์มบันทึกมื้ออาหารได้
        </h2>
        <p className="max-w-md text-muted-foreground">
          เกิดข้อผิดพลาดขณะโหลดหน้าบันทึกมื้ออาหาร
          ข้อมูลที่คุณกรอกไปอาจสูญหาย กรุณาลองใหม่อีกครั้ง
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
