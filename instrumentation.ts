// ไฟล์ Instrumentation มาตรฐานของ Next.js ใช้เป็นจุดเริ่มต้น (Entrypoint)
// ในการลงทะเบียนและเปิดใช้งานระบบ Monitoring ฝั่ง Server และ Edge ทันทีที่ Next.js เริ่มทำงาน
import * as Sentry from "@sentry/nextjs";

export async function register() {
  // หากสภาพแวดล้อมเป็น Node.js Server (เช่น API Routes, SSR) ให้โหลดคอนฟิกฝั่ง Server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  // หากสภาพแวดล้อมเป็น Edge Runtime (เช่น Middleware) ให้โหลดคอนฟิกฝั่ง Edge
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// ฟังก์ชันดักจับ Error ระดับ Server Request ของ Next.js ส่งตรงเข้า Sentry อัตโนมัติ
export const onRequestError = Sentry.captureRequestError;
