# CalDay — TODO & Improvement Tracker

> สร้างเมื่อ: 2026-08-20
> สถานะ: กำลังพัฒนา (v0.1.0)

---

## 🔴 P0 — Critical Bugs (ต้องแก้ก่อน Deploy)

- [ ] **1. `checkAndComsumeAiQuota` ไม่ได้ `await`**
  - ไฟล์: `app/api/meals/route.ts`
  - ปัญหา: ถ้า user เกิน quota จะไม่ถูก block เพราะ function ไม่ได้รอผลลัพธ์
  - แก้:
    ```typescript
    // ❌ ตอนนี้
    checkAndComsumeAiQuota(userId, user.subscription?.plan as string);

    // ✅ ควรเป็น
    const quotaResponse = await checkAndComsumeAiQuota(userId, user.subscription?.plan as string);
    if (quotaResponse) return quotaResponse;
    ```

- [ ] **2. Analytics API มี Typo ชื่อ Field**
  - ไฟล์: `app/api/analytics/route.ts`
  - ปัญหา: ใช้ `tragetProtein` / `tragetCalories` แทน `targetProtein` / `targetCalories` — จะ error ตอน runtime
  - แก้:
    ```typescript
    // ❌ ตอนนี้
    const targetPro = profile?.tragetProtein || 100;
    const dayTargetCal = summaryForDate?.tragetCalories || targetCal;
    const dayTargetPro = summaryForDate?.tragetProtein || targetPro;

    // ✅ ควรเป็น
    const targetPro = profile?.targetProtein || 100;
    const dayTargetCal = summaryForDate?.targetCalories || targetCal;
    const dayTargetPro = summaryForDate?.targetProtein || targetPro;
    ```

- [ ] **3. Signup Route — Dummy Hash ว่างเปล่า**
  - ไฟล์: `app/api/auth/signup/route.ts`
  - ปัญหา: `DUMMY_HASH_12 = ""` → bcrypt.compare จะ error แทนที่จะหน่วงเวลา
  - แก้: ใช้ hash จริงระดับ 12 rounds เช่น `"$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`

- [ ] **4. Prisma Client ไม่ใช้ Singleton**
  - ไฟล์: `lib/db/prisma.ts`
  - ปัญหา: ใน Serverless ทุก cold start จะสร้าง Connection Pool ใหม่ → หมด Connection เร็ว
  - แก้:
    ```typescript
    // ✅ ใช้ globalThis cache
    const globalForPrisma = globalThis as unknown as { prisma: typeof prisma };
    export default globalForPrisma.prisma ?? (globalForPrisma.prisma = prisma);
    ```

- [ ] **5. AI Model ชื่อผิด**
  - ไฟล์: `lib/services/ai.ts`
  - ปัญหา: `"gemini-3.6-flash"` ยังไม่มีอยู่จริง
  - แก้: เปลี่ยนเป็น `"gemini-2.0-flash"` หรือ `"gemini-1.5-flash"`

---

## 🟡 P1 — Security & Robustness

- [ ] **6. สร้าง Middleware ป้องกันหน้า**
  - ไฟล์ใหม่: `app/middleware.ts`
  - ทำอะไร:
    - ป้องกัน `/dashboard`, `/profile`, `/analytics`, `/meals/new`, `/subscription` ถ้าไม่ login
    - Redirect หน้า `/signin`, `/signup` ถ้า login แล้ว

- [ ] **7. เพิ่ม Env Validation**
  - ไฟล์ใหม่: `lib/env.ts`
  - ทำอะไร:
    - ใช้ Zod validate `process.env` ตอน startup
    - ป้องกัน crash จาก env variable หายตอน deploy
    - ต้องมี: `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `GOOGLE_GENERATIVE_AI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_APP_URL`

- [ ] **8. เพิ่ม Input Validation ใน Meal POST**
  - ไฟล์: `app/api/meals/route.ts`
  - ทำอะไร:
    - สร้าง `lib/validation/meal.ts` ด้วย Zod schema
    - Validate `mealText`, `mealType`, `date` ก่อนประมวลผล

- [x] **9. แก้ Error Response ที่ Leak ข้อมูลภายใน**
  - ไฟล์: `app/api/meals/route.ts:180`
  - ปัญหา: `error: String(error)` จะแสดง internal error message ให้ user เห็น
  - แก้: แสดง error message ทั่วไป เช่น `"Internal server error"` เท่านั้น

- [ ] **10. เพิ่ม Security Headers**
  - ไฟล์: `next.config.ts`
  - ทำอะไร:
    - เพิ่ม `X-Frame-Options: DENY`
    - เพิ่ม `X-Content-Type-Options: nosniff`
    - เพิ่ม `Referrer-Policy: strict-origin-when-cross-origin`
    - พิจารณาเพิ่ม CSP header

- [ ] **11. Webhook Idempotency Check**
  - ไฟล์: `app/api/webhook/route.ts`
  - ทำอะไร:
    - เช็ค `event.id` กับ Redis/DB ก่อน process เพื่อป้องกัน duplicate processing
    - บันทึก event ที่ process แล้ว

- [ ] **12. สร้าง Error Boundary ทุก Route**
  - ไฟล์ใหม่: `app/dashboard/error.tsx`, `app/profile/error.tsx`, `app/meals/new/error.tsx`, `app/analytics/error.tsx`, `app/subscription/error.tsx`
  - ทำอะไร: แสดง fallback UI ถ้า component crash

- [ ] **13. สร้าง Loading States**
  - ไฟล์ใหม่: `app/dashboard/loading.tsx`, `app/profile/loading.tsx`, `app/meals/new/loading.tsx`, `app/analytics/loading.tsx`
  - ทำอะไร: แสดง skeleton/spinner ขณะโหลดข้อมูล

---

## 🟢 P2 — Testing & Quality

- [ ] **14. ตั้งค่า Test Framework**
  - ทำอะไร:
    - ติดตั้ง Vitest (เร็วกว่า Jest กับ Next.js)
    - สร้าง `vitest.config.ts`
    - เพิ่ม script `"test": "vitest"` ใน package.json

- [ ] **15. เขียน Unit Tests — `lib/nutrition.ts`**
  - ทดสอบ:
    - `calculateDailyNutritionTargets()` — ทดสอบทุก Goal, ExerciseLevel
    - `getBmiStatus()` — ทดสอบ Underweight, Healthy, Overweight
    - `buildProfileNutritionSummary()` — ทดสอบ output structure

- [ ] **16. เขียน Unit Tests — `lib/services/ai-quota.ts`**
  - ทดสอบ:
    - `getUserAiQuota()` — ทดสอบ FREE/PRO limit
    - `checkAndComsumeAiQuota()` — ทดสอบ quota check + Redis increment

- [ ] **17. เขียน Unit Tests — `lib/validation/auth.ts`**
  - ทดสอบ:
    - `signupSchema` — ทดสอบ valid/invalid input ทุก case

- [ ] **18. เขียน API Integration Tests**
  - ทดสอบ:
    - `POST /api/meals` — ทดสอบ meal creation flow
    - `GET /api/meals` — ทดสอบ monthly summary
    - `GET /api/profile` — ทดสอบ profile retrieval
    - `POST /api/profile` — ทดสอบ profile creation/update

---

## 🟢 P3 — Features & Enhancements

- [ ] **19. สร้าง Prisma Seed Script**
  - ไฟล์ใหม่: `prisma/seed.ts`
  - ทำอะไร: seed ข้อมูล test user + sample meals สำหรับ development

- [ ] **20. สร้าง Health Check API**
  - ไฟล์ใหม่: `app/api/health/route.ts`
  - ทำอะไร: เช็ค Database + Redis connection status

- [ ] **21. เพิ่ม Structured Logging**
  - ทำอะไร:
    - ติดตั้ง Pino
    - สร้าง `lib/logger.ts`
    - แทนที่ `console.error` ด้วย structured logger ทุกที่

- [ ] **22. สร้าง DELETE API สำหรับ Meal**
  - ไฟล์ใหม่: `app/api/meals/[id]/route.ts`
  - ทำอะไร:
    - ให้ user ลบ meal ที่บันทึกไว้
    - อัปเดต DailySummary ให้ตรง (ลดแคลอรี/โปรตีน)

- [ ] **23. สร้าง PUT/PATCH API สำหรับ Meal Edit**
  - ทำอะไร: ให้ user แก้ไข meal ที่บันทึกไว้

- [ ] **24. เพิ่ม Optimistic UI Updates**
  - ไฟล์: `app/meals/new/page.tsx`, `app/dashboard/page.tsx`
  - ทำอะไร: อัปเดต UI ทันทีก่อน API response เพื่อให้แอปดูไวขึ้น

- [ ] **25. เพิ่ม Daily Summary Cron Job**
  - ทำอะไร:
    - สร้าง API endpoint สำหรับ cron job
    - สรุปข้อมูลอาหารอัตโนมัติทุกเที่ยงคืน
    - ใช้ Vercel Cron หรือ external scheduler

- [ ] **26. เพิ่ม Toast Notifications**
  - ทำอะไร:
    - ติดตั้ง sonner หรือ react-hot-toast
    - แสดง notification สำหรับ success/error แทน inline message

- [ ] **27. ปรับปรุง Mobile UX**
  - ทำอะไร:
    - เพิ่ม bottom navigation bar สำหรับ mobile
    - ปรับ meal form ให้ใช้งานง่ายขึ้นบนมือถือ

- [ ] **28. เพิ่ม Dark/Light Theme Toggle**
  - ทำอะไร:
    - ตอนนี้ forced dark mode เท่านั้น
    - เพิ่ม toggle ให้ user เลือกได้

---

## 📝 Code Quality & Cleanup

- [ ] **29. แก้ Typo ชื่อไฟล์**
  - `lib/auth/sesstion.ts` → `lib/auth/session.ts`
  - `app/components/SesstionProvider.tsx` → `app/components/SessionProvider.tsx`
  - อัปเดต import path ทุกที่ที่เกี่ยวข้อง

- [ ] **30. รวม Session Helper ให้一致**
  - มีทั้ง `getSession()` ใน `lib/auth/session.ts` และ `getServerSession(authOptions)` เรียกตรง
  - ✅ ใช้ตัวเดียวให้ consistent ทั้งโปรเจค

- [ ] **31. เพิ่ม JSDoc / Type Annotations**
  - เพิ่ม comment อธิบาย function สำคัญๆ
  - เพิ่ม return type ทุก function

- [ ] **32. รัน `npm run lint` แล้วแก้ warning ทั้งหมด**

- [ ] **33. รัน `npx tsc --noEmit` แล้วแก้ type error ทั้งหมด**

---

## 📊 สรุป

| Priority | จำนวน | สถานะ |
|----------|--------|-------|
| 🔴 P0 — Critical Bugs | 5 | ⬜ ยังไม่ได้ทำ |
| 🟡 P1 — Security | 8 | ⬜ ยังไม่ได้ทำ |
| 🟢 P2 — Testing | 5 | ⬜ ยังไม่ได้ทำ |
| 🟢 P3 — Features | 10 | ⬜ ยังไม่ได้ทำ |
| 📝 Code Quality | 5 | ⬜ ยังไม่ได้ทำ |
| **รวม** | **33** | |

---

> **หมายเหตุ:** ควรทำ P0 ก่อนเสมอ ตามด้วย P1 → P2 → P3 → Code Quality
