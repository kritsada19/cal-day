import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// สร้าง plugin ที่ชี้ไปยังไฟล์ ./i18n/request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

// กำหนด Content Security Policy (CSP)
// - default-src 'self': อนุญาตให้โหลดทรัพยากรจากโดเมนของเราเองเท่านั้นเป็นค่าเริ่มต้น
// - script-src 'self' 'unsafe-inline' ...: อนุญาตให้รันสคริปต์จากโดเมนของเราและแบบ inline (ใน dev จะเพิ่ม 'unsafe-eval' เพื่อรองรับ React Fast Refresh)
// - style-src 'self' 'unsafe-inline': อนุญาตสไตล์ชีตจากโดเมนของเราและแบบ inline (จำเป็นสำหรับ Tailwind CSS / CSS-in-JS)
// - connect-src: อนุญาตให้เบราว์เซอร์ติดต่อแหล่งข้อมูลที่แอปใช้งานจริง เช่น API ของตัวเอง, Stripe, และ WebSocket
// - img-src: อนุญาตให้โหลดรูปภาพจากแหล่งที่แอปใช้งานจริง เช่น รูปโปรไฟล์จาก Google หรือ CDN ภายนอก
// - font-src 'self': อนุญาตโหลดฟอนต์จากโดเมนของเราเท่านั้น
// - object-src 'none': ปิดการใช้งาน plugin ต่างๆ เช่น Flash เพื่อลดความเสี่ยงด้านความปลอดภัย
// - base-uri 'self': บังคับให้ URL ใน tag <base> ต้องชี้มาที่ตัวเองเท่านั้น
// - form-action 'self': อนุญาตให้ส่งข้อมูลฟอร์มไปยังโดเมนของเราเองเท่านั้น
// - frame-ancestors 'none': ห้ามไม่ให้เว็บไซต์อื่นนำเว็บของเราไปแสดงใน iframe/frame (ช่วยป้องกัน Clickjacking)
// - frame-src: อนุญาตให้โหลด embedded content จากแหล่งที่จำเป็น เช่น Stripe checkout หรือ iframe ภายนอกที่แอปใช้งานจริง
// - script-src: สำหรับ dev ให้ยอม inline/eval เพื่อให้ Next.js ทำงานได้, ส่วน production ควรลดความอ่อนแอลงให้มากขึ้น
// - report-uri / report-to: ใช้สำหรับ monitoring CSP violation โดยไม่บล็อกทันทีก่อนพิจารณาให้แน่ใจว่าตำแหน่งผิดพลาดถูกตรวจพบก่อนบังคับใช้
// - upgrade-insecure-requests: บังคับเปลี่ยนการเชื่อมต่อ HTTP เป็น HTTPS โดยอัตโนมัติ
// เพิ่ม frame-src ให้ชัดเจนเพื่อรองรับ Stripe หรือ iframe ที่ต้องใช้งานในหน้า payment
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.stripe.com https://*.stripe.com wss:;
  img-src 'self' blob: data: https://lh3.googleusercontent.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-src 'self' https://js.stripe.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
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
            // บังคับให้เบราว์เซอร์ใช้ HTTPS อย่างถาวรสำหรับโดเมนนี้ เพื่อป้องกัน SSL stripping
            // ใน development ให้ใช้ max-age=0 เพื่อหลีกเลี่ยงผลกระทบกับ localhost
            key: "Strict-Transport-Security",
            value: isDev
              ? "max-age=0"
              : "max-age=31536000; includeSubDomains; preload",
          },
          {
            // กำหนด header หลักที่บังคับ CSP จริงเพื่อป้องกันการโหลดทรัพยากรที่ไม่ได้อนุญาต
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
          {
            // เพิ่ม report-only header เพื่อ monitor violation โดยไม่ทำให้แอปล่มระหว่างรอปรับ policy
            // ใช้ในขั้นตอนทดสอบก่อนย้ายไปบังคับจริงใน production
            key: "Content-Security-Policy-Report-Only",
            value: `${cspHeader.replace(/\s{2,}/g, " ").trim()} report-uri https://example.com/csp-report;`,
          },
        ],
      },
    ];
  },
};

// ครอบ nextConfig ด้วย withSentryConfig เพื่อให้อัปโหลด Source Maps และเชื่อมต่อ Sentry
export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/uploading/bundler-plugin-options/

  // ชื่อ Organization ในแดชบอร์ด Sentry
  org: "kritsada-9q",

  // ชื่อ Project ใน Sentry
  project: "calday",

  // Only print logs for uploading source maps in CI
  // แสดงผล log การอัปโหลด Source Maps เฉพาะในระบบ CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  // อัปโหลด Source Maps ให้ละเอียดขึ้น เพื่อให้เห็นบรรทัด TypeScript ในฝั่ง Client ชัดเจน
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // ทำ Tunnel Route ผ่าน /monitoring เพื่อป้องกัน Ad-blocker บล็อกการส่งข้อมูล Error
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    // เปิดใช้งานการติดตามสถานะของ Vercel Cron Monitors อัตโนมัติ
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      // ตัด debug logger ออกเพื่อลดขนาด bundle size
      removeDebugLogging: true,
    },
  },
});
