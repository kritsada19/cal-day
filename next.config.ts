import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// กำหนด Content Security Policy (CSP)
// - default-src 'self': อนุญาตให้โหลดทรัพยากรจากโดเมนของเราเองเท่านั้นเป็นค่าเริ่มต้น
// - script-src 'self' 'unsafe-inline' ...: อนุญาตให้รันสคริปต์จากโดเมนของเราและแบบ inline (ใน dev จะเพิ่ม 'unsafe-eval' เพื่อรองรับ React Fast Refresh)
// - style-src 'self' 'unsafe-inline': อนุญาตสไตล์ชีตจากโดเมนของเราและแบบ inline (จำเป็นสำหรับ Tailwind CSS / CSS-in-JS)
// - img-src 'self' blob: data:: อนุญาตโหลดรูปภาพจากโดเมนของเรา, blob และ data URL
// - font-src 'self': อนุญาตโหลดฟอนต์จากโดเมนของเราเท่านั้น
// - object-src 'none': ปิดการใช้งาน plugin ต่างๆ เช่น Flash เพื่อลดความเสี่ยงด้านความปลอดภัย
// - base-uri 'self': บังคับให้ URL ใน tag <base> ต้องชี้มาที่ตัวเองเท่านั้น
// - form-action 'self': อนุญาตให้ส่งข้อมูลฟอร์มไปยังโดเมนของเราเองเท่านั้น
// - frame-ancestors 'none': ห้ามไม่ให้เว็บไซต์อื่นนำเว็บของเราไปแสดงใน iframe/frame (ช่วยป้องกัน Clickjacking)
// - upgrade-insecure-requests: บังคับเปลี่ยนการเชื่อมต่อ HTTP เป็น HTTPS โดยอัตโนมัติ
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // กำหนดให้ Headers เหล่านี้มีผลกับทุก Route ในแอปพลิเคชัน
        source: "/:path*",
        headers: [
          {
            // ป้องกันไม่ให้เว็บถูกนำไปแสดงใน iframe ของเว็บอื่น (ป้องกัน Clickjacking)
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // ป้องกันการโจมตีโดยการเดาชนิดของไฟล์ (MIME-Type Sniffing)
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // ควบคุมการส่งข้อมูลผู้ใช้ต้นทาง (Referrer) เมื่อคลิกไปยังลิงก์ภายนอก
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // กำหนดขอบเขตความปลอดภัยของทรัพยากรที่อนุญาตให้ดาวน์โหลดและรัน
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

