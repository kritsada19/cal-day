"use client";

// ไฟล์ Global Error Boundary สำหรับ Next.js App Router
// จะถูกเรียกทำงานเมื่อเกิด Error ร้ายแรงระดับ Root Layout (ทำให้หน้าเว็บหลักไม่สามารถเรนเดอร์ได้)
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // ส่ง Error ไปยัง Sentry อัตโนมัติเมื่อหน้านี้ถูกแสดง
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* แสดงหน้า Error มาตรฐานของ Next.js */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
