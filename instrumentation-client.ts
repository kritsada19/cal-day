// ไฟล์นี้ใช้สำหรับตั้งค่าการทำงานของ Sentry บนฝั่ง Client (เบราว์เซอร์ของผู้ใช้งาน)
// โค้ดส่วนนี้จะทำงานเมื่อผู้ใช้เปิดหน้าเว็บบนเบราว์เซอร์ เพื่อดักจับ Error และบันทึก Session Replay
// อ่านเพิ่มเติมได้ที่: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // DSN (Data Source Name): ที่อยู่ปลายทางของโปรเจกต์ Sentry
  dsn: "https://aa29103ea30ac8d3c2e505cdf8adb287@o4512399465054208.ingest.us.sentry.io/4512399476326400",

  // integrations: เสริมฟังก์ชันเพิ่มเติม เช่น บันทึก Session Replay (วิดีโอจำลองการคลิกของผู้ใช้)
  integrations: [Sentry.replayIntegration()],

  // tracesSampleRate: กำหนดอัตราสุ่มเก็บข้อมูล Performance การโหลดหน้าเว็บ (1 = 100%)
  tracesSampleRate: 1,

  // replaysSessionSampleRate: กำหนดอัตราสุ่มบันทึก Replay สำหรับเซสชันการใช้งานทั่วไป (0.1 = สุ่มบันทึก 10% ของผู้ใช้)
  replaysSessionSampleRate: 0.1,

  // replaysOnErrorSampleRate: กำหนดอัตราสุ่มบันทึก Replay เมื่อเกิด Error ขึ้น (1.0 = บันทึกคลิปเหตุการณ์ 100% ทุกครั้งที่มี Error)
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // ปิดการส่งข้อมูลผู้ใช้ (PII) หรือ HTTP request body ได้หากต้องการ
    // ดูรายละเอียด: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

// ดักจับจังหวะการเปลี่ยนหน้าของ Next.js Router เพื่อวัดความเร็ว Performance ในการนำทางระหว่างหน้า
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
