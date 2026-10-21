"use client"; // ต้องเป็น Client Component เสมอ เพราะ Error Boundary ใช้ React state ในการ catch error

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * SubscriptionError — Error Boundary สำหรับ /subscription
 *
 * จะถูก render แทนที่ page.tsx เมื่อเกิด runtime error ใน /subscription segment
 * สำคัญมากสำหรับหน้า payment — ต้อง handle error อย่างระมัดระวัง
 * เพื่อไม่ให้ผู้ใช้เกิดความสับสนเรื่องสถานะการชำระเงิน
 *
 * Props ที่ Next.js ส่งมาให้:
 *   - error   : Error object ที่ถูก throw
 *   - reset   : ฟังก์ชันสำหรับ re-render segment นี้ใหม่โดยไม่ reload หน้า
 */
export default function SubscriptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error ไปยัง console และควร report ไปยัง Sentry สำหรับ payment error
  // เพราะปัญหาในหน้า subscription อาจส่งผลต่อรายได้
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, "Subscription error boundary triggered");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-6 bg-canvas px-4 py-10 text-center">
      {/* Icon แสดงสถานะ error — ใช้ credit card icon เพราะเกี่ยวข้องกับ subscription */}
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
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
          />
        </svg>
      </div>

      {/* ข้อความแจ้ง error — ระบุชัดเจนว่าการชำระเงินยังไม่ถูกดำเนินการ */}
      <div role="alert" className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Unable to load Subscription page
        </h2>
        <p className="max-w-md text-base leading-7 text-muted">
          An error occurred while loading your Subscription data.
          <strong className="mt-1 block font-semibold text-ink">
            If you were in the middle of a payment, don&apos;t worry — it has not been processed.
          </strong>
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