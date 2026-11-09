// ไฟล์นี้ใช้สำหรับตั้งค่าการทำงานของ Sentry บน Edge Runtime (เช่น Next.js Middleware หรือ Edge Route Handlers)
// การตั้งค่าที่นี่จะถูกโหลดเมื่อมีการใช้งานฟังก์ชันที่ทำงานบน Edge Environment
// ข้อสังเกต: การตั้งค่านี้จำเป็นต้องมีไม่ว่าจะรันบน Vercel Edge หรือรันแบบ localhost ก็ตาม
// อ่านเพิ่มเติมได้ที่: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // DSN (Data Source Name): ที่อยู่ปลายทางของโปรเจกต์ Sentry ที่ใช้ส่ง Error ไปบันทึก
  dsn: "https://aa29103ea30ac8d3c2e505cdf8adb287@o4512399465054208.ingest.us.sentry.io/4512399476326400",

  // tracesSampleRate: กำหนดสัดส่วนการสุ่มเก็บข้อมูล Performance Tracing (1 = เก็บ 100%)
  // ใน production สามารถปรับลดลง (เช่น 0.1 = 10%) เพื่อประหยัดโควตา
  tracesSampleRate: 1,

  dataCollection: {
    // ปิดการส่งข้อมูลส่วนตัวของผู้ใช้ (PII) หรือ HTTP request body ได้หากต้องการ
    // ดูรายละเอียด: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
