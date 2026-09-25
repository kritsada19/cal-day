# CalDay 🥗 (AI-Powered Nutrition & Calorie Tracker)

CalDay คือเว็บแอปพลิเคชันสำหรับการติดตามโภชนาการและการนับแคลอรีในแต่ละวัน ขับเคลื่อนด้วย AI (Google Gemini) ที่ช่วยให้การบันทึกมื้ออาหารเป็นเรื่องง่าย พร้อมระบบจัดการโปรไฟล์ผู้ใช้ คำนวณ BMR/TDEE อัตโนมัติ และระบบ Subscription

โปรเจคนี้ถูกพัฒนาขึ้นด้วย **Next.js 16 (App Router)** และ **React 19** โดยเน้นโครงสร้างแบบ Full-Stack ที่มีประสิทธิภาพ รองรับฐานข้อมูล PostgreSQL และ Redis สำหรับการจัดการแคช/ระบบ Real-time เหมาะสำหรับใช้เป็นกรณีศึกษาหรือพอร์ตโฟลิโอสำหรับการพัฒนาเว็บแอปพลิเคชันสมัยใหม่

## 🌟 ฟีเจอร์หลัก (Key Features)

- **User Authentication:** ระบบล็อกอินที่ปลอดภัยด้วย NextAuth.js รองรับ OAuth (Google, GitHub) และ Credentials
- **Smart Profile & BMR/TDEE:** ระบบคำนวณเป้าหมายแคลอรีและโปรตีนต่อวันอัตโนมัติ ตามข้อมูลสุขภาพ เป้าหมาย และระดับการทำกิจกรรม (Exercise Level)
- **Meal & Food Tracking:** บันทึกอาหารแบ่งตามมื้อ (เช้า, กลางวัน, เย็น, ว่าง) พร้อมรายละเอียดแคลอรีและโปรตีน
- **Daily Summaries:** สรุปผลการกินอาหารรายวัน เปรียบเทียบกับเป้าหมายที่ตั้งไว้
- **AI Integration:** ใช้ Google Generative AI (Gemini) เพื่อช่วยประมวลผลข้อมูล
- **Pro Subscriptions:** ระบบสมัครสมาชิกแบบพรีเมียมเพื่อเข้าถึงฟีเจอร์ขั้นสูง จัดการการชำระเงินและบิลลิ่งด้วย Stripe
- **Real-time Monitoring:** มีระบบ Heartbeat Mechanism เพื่อตรวจสอบสถานะออนไลน์ของผู้ใช้แบบ Real-time ด้วย Redis (Pub/Sub)

## 💻 Tech Stack (เทคโนโลยีที่ใช้)

**Frontend:**
- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (Icons)
- [Next Themes](https://github.com/pacocoursey/next-themes) (Dark/Light mode)

**Backend & Database:**
- [PostgreSQL](https://www.postgresql.org/) (ผ่าน Docker)
- [Prisma ORM](https://www.prisma.io/)
- [Redis](https://redis.io/) (`ioredis`) (ผ่าน Docker)

**Authentication & Payment:**
- [NextAuth.js](https://next-auth.js.org/)
- [Stripe](https://stripe.com/)

**AI & Utilities:**
- [Google Generative AI](https://ai.google.dev/) (Gemini)
- [Zod](https://zod.dev/) (Schema Validation)
- [Pino](https://getpino.io/) (Logging)

**DevTools & Testing:**
- [Docker & Docker Compose](https://www.docker.com/)
- [Vitest](https://vitest.dev/) (Unit Testing)
- [ESLint](https://eslint.org/)

## 🚀 เริ่มต้นการใช้งาน (Getting Started)

### สิ่งที่ต้องมีเบื้องต้น (Prerequisites)
- [Node.js](https://nodejs.org/) (v20+)
- [Docker & Docker Compose](https://www.docker.com/) สำหรับรัน Database และ Redis

### การติดตั้ง (Installation)

1. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/calday.git
   cd calday
   ```

2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables:**
   โปรเจคนี้มีไฟล์ `.env.example` ให้คัดลอกเป็น `.env` หรือ `.env.local` และกำหนดค่าต่างๆ ให้ครบถ้วน (Database URL, NextAuth, Stripe, Gemini AI Key)
   ```bash
   cp .env.example .env
   ```

4. **รัน Database และ Redis ผ่าน Docker:**
   ```bash
   docker-compose up -d
   ```
   *(ระบบจะเปิดพอร์ต `7777` สำหรับ PostgreSQL และ `6379` สำหรับ Redis)*

5. **สร้าง Schema ในฐานข้อมูล (Prisma Migration):**
   ```bash
   npx prisma db push
   ```

6. **เริ่มต้น Development Server:**
   ```bash
   npm run dev
   ```

7. **เข้าใช้งานแอปพลิเคชัน:**
   เปิดเบราว์เซอร์แล้วไปที่ [http://localhost:3000](http://localhost:3000)

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

- **`User` & `Account`:** บริหารจัดการผู้ใช้และช่องทางการล็อกอิน
- **`Profile`:** เก็บข้อมูลพื้นฐาน (น้ำหนัก, ส่วนสูง, เป้าหมาย) และเก็บค่า BMR / TDEE
- **`Meal` & `FoodEntry`:** บันทึกข้อมูลมื้ออาหารแต่ละมื้อ และรายการย่อยในมื้อนั้นๆ พร้อมคุณค่าทางโภชนาการ
- **`DailySummary`:** สรุปยอดรวมแคลอรีและสารอาหารประจำวัน
- **`Subscription`:** ดูแลสถานะบัญชี Pro / Free ของผู้ใช้งาน

## 🧪 การรันเทสต์ (Testing)
โปรเจคนี้ใช้ `Vitest` ในการทำ Automated Testing
```bash
npm run test
```
