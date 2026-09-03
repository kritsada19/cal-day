# Calday Portfolio Improvement Plan 🚀

นี่คือรายการสิ่งที่ควรปรับปรุงและเพิ่มเติมในโปรเจค `calday` เพื่อให้เป็นผลงานที่โดดเด่นและแสดงให้เห็นถึงทักษะระดับมืออาชีพ (Real-world skills) สำหรับใช้สมัครงานครับ

## 1. Documentation & Presentation (สำคัญมากสำหรับ Portfolio) 📄
- [ ] **เขียน README.md ใหม่ทั้งหมด**: ตอนนี้ยังเป็น default ของ Next.js อยู่ ควรแก้ให้มี:
  - 📝 ชื่อโปรเจคและคำอธิบายสั้นๆ (Pitch) ว่าแอปทำอะไร (เช่น AI Calorie Tracker)
  - 📸 Screenshots หรือ GIF สาธิตการใช้งาน
  - 🛠️ Tech Stack ที่ใช้ (Next.js, Prisma, Stripe, Gemini AI, Redis)
  - 🚀 วิธีการติดตั้งและรันโปรเจค (รวมถึงการตั้งค่า `.env` จาก `.env.example`)
  - 🏛️ Architecture & Features หลักของแอป
- [ ] **สร้าง System Architecture Diagram**: วาดแผนภาพคร่าวๆ ว่า Client, Server (Next.js), Database, Redis, และ 3rd Party (Stripe, Gemini) คุยกันยังไง (โชว์ทักษะ System Design)

## 2. Engineering Best Practices ⚙️
- [ ] **CI/CD Pipeline (GitHub Actions)**:
  - สร้าง workflow สำหรับรัน `npm run lint` และ `npm run test` ทุกครั้งที่มีการ Push/PR
  - การทำ CI/CD เป็นสิ่งที่บริษัทส่วนใหญ่ต้องการมาก
- [ ] **Git Workflow & Conventional Commits**:
  - ใช้ `husky` และ `commitlint` เพื่อบังคับรูปแบบการ commit ให้เป็นมาตรฐาน (เช่น `feat: add stripe integration`, `fix: auth bug`)
- [ ] **Error Monitoring**:
  - ติดตั้งเครื่องมืออย่าง **Sentry** เพื่อดักจับ Error ทั้งฝั่ง Client และ Server (แสดงให้เห็นว่าเราใส่ใจเรื่อง Production readiness)

## 3. Testing (แสดงความรอบคอบ) 🧪
- [ ] **เพิ่ม Unit Tests**: ตอนนี้มี `nutrition.test.ts` แล้ว ควรเพิ่มเทสสำหรับ Services อื่นๆ โดยเฉพาะเรื่องที่เกี่ยวข้องกับเงิน (Stripe) หรือสิทธิ์การใช้งาน (Auth)
- [ ] **E2E Testing (End-to-End)**:
  - ลองใช้ **Playwright** หรือ **Cypress** เขียนเทส Flow หลัก (เช่น สมัครสมาชิก -> ล็อกอิน -> เพิ่มรายการอาหาร -> จ่ายเงิน Subscription)

## 4. Code Architecture & Clean Code 🏗️
- [ ] **Refactor Components**: โครงสร้างตอนนี้มี `app/components` ซึ่งใช้งานได้ แต่ถ้าโปรเจคใหญ่ขึ้น อาจพิจารณาย้ายโฟลเดอร์ที่เป็น UI/Components ออกมาไว้ระดับ root หรือโฟลเดอร์ `src/` เพื่อไม่ให้ปนกับโฟลเดอร์ Routing (`app/`)
- [ ] **Centralized API Error Handling**:
  - จัดการ Error จาก API ให้เป็นมาตรฐานเดียวกัน (เช่น สร้าง Error Wrapper/Middleware)
- [ ] **Strict TypeScript**:
  - ตรวจสอบ `tsconfig.json` ว่าเปิด `strict: true` แล้วหรือยัง และกำจัด type `any` ออกให้หมด

## 5. Performance & Security 🚀🔒
- [ ] **Rate Limiting**: เห็นมี `lib/rate-limit.ts` (ใช้ Redis) แล้ว ถือว่าดีมาก! ตรวจสอบว่าได้นำไปใช้กับ API ที่เรียกบ่อยๆ หรือที่มีค่าใช้จ่ายสูง (เช่น การเรียก Gemini AI หรือหน้า Sign In) หรือยัง
- [ ] **Web Vitals & Optimization**:
  - ตรวจสอบคะแนน Lighthouse
  - ใช้ `next/image` ให้ครบถ้วน
  - ทำ Lazy loading สำหรับ Component ใหญ่ๆ
- [ ] **Security Headers**:
  - เพิ่ม CSP (Content Security Policy) ใน `next.config.ts`

## 6. Features สำหรับโชว์สกิลเพิ่มเติม ✨
- [ ] **Admin Dashboard / Role-based Access Control (RBAC)**: สร้างหน้าแอดมินสำหรับดูสถิติผู้ใช้งาน โชว์ว่าเราทำระบบจำกัดสิทธิ์ (Admin vs User) ได้
- [ ] **Webhooks Handling**: สำหรับ Stripe ตรวจสอบว่ามีการจัดการ Webhook อย่างถูกต้อง ป้องกันปัญหาขัดข้องและยืนยัน Signature อย่างรัดกุม

---
**💡 คำแนะนำ:** ไม่จำเป็นต้องทำครบทุกข้อในวันเดียว แนะนำให้เริ่มจาก **ข้อ 1 (README)** และ **ข้อ 2 (CI/CD)** ก่อน เพราะเป็นสิ่งแรกที่ Recruiter และ Senior Developer จะมองหาเวลาเข้าไปดู GitHub ของคุณครับ!
