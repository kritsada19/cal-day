"use client"; // ต้องเป็น Client Component เสมอ เพราะ Error Boundary ใช้ React state ในการ catch error

import { useEffect } from "react";

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
    console.error("[Profile Error Boundary]", error);
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
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </div>

      {/* ข้อความแจ้ง error */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          โปรไฟล์โหลดไม่ได้
        </h2>
        <p className="max-w-md text-muted-foreground">
          เกิดข้อผิดพลาดขณะโหลดข้อมูลโปรไฟล์ของคุณ
          กรุณาลองรีเฟรชหน้าหรือลองใหม่อีกครั้ง
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
