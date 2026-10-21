"use client"; // ต้องเป็น Client Component เสมอ เพราะ Error Boundary ใช้ React state ในการ catch error

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * ProfileError — Error Boundary สำหรับ /profile
 *
 * จะถูก render แทนที่ page.tsx เมื่อเกิด runtime error ใน /profile segment
 * รวมถึง error ที่เกิดขึ้นใน nested layouts/pages ภายใต้ /profile ด้วย
 *
 * Props ที่ Next.js ส่งมาให้:
 *   - error   : Error object ที่ถูก throw
 *   - reset   : ฟังก์ชันสำหรับ re-render segment นี้ใหม่โดยไม่ reload หน้า
 */
export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error ทุกครั้งที่ error object เปลี่ยนแปลง (เช่น เกิด error ซ้ำ)
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "Profile error boundary triggered");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-6 bg-canvas px-4 py-10 text-center">
      {/* Icon แสดงสถานะ error */}
      <div
        aria-hidden="true"
        className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/10 text-danger"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </div>

      {/* ข้อความแจ้ง error */}
      <div role="alert" className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Unable to load profile
        </h2>
        <p className="max-w-md text-base leading-7 text-muted">
          An error occurred while loading your profile data.
          Please try refreshing the page or try again.
        </p>

        {/* แสดง error digest เฉพาะ development mode เพื่อช่วย debug */}
        {error.digest && (
          <p className="text-sm text-muted">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* ปุ่ม retry — เรียก reset() เพื่อให้ Next.js ลอง render segment ใหม่ */}
      <button
        onClick={reset}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Try again
      </button>
    </div>
  );
}