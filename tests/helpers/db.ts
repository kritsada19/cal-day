import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// โหลด environment variables จาก .env / .env.local เพื่อให้ได้ค่า DATABASE_URL ตอนรันผ่าน Playwright runner
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * ============================================================================
 * 💡 ทำไมถึงเลือกใช้ `pg` (node-postgres) แทน Prisma Client ใน Playwright Test?
 * ============================================================================
 * 1. หลีกเลี่ยงปัญหา ESM Module & import.meta:
 *    - ในโปรเจกต์นี้ Prisma Client ถูก generate ใน `app/generated/prisma/client.ts`
 *      ซึ่งเป็น ES Module (ESM) และมีการใช้ `import.meta`
 *    - เมื่อ Playwright (รันบน Node.js / ts-node runtime) พยายาม import `@/lib/db/prisma`
 *      Node.js จะพ่น SyntaxError: "Cannot use 'import.meta' outside a module"
 * 2. เบาและตรงจุด (Lightweight):
 *    - ใน E2E Test เราต้องการเพียง Query ดึง token หรือ clean data เท่านั้น
 *      การใช้ `pg` คิวรี่ฐานข้อมูลโดยตรงทำงานได้รวดเร็ว ไม่ผูกมัดกับ lifecycle หรือ adapter ของ Next.js
 * ============================================================================
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * ดึง Verification Token ล่าสุดจากตาราง VerificationToken ตาม email
 */
export async function getVerificationToken(email: string): Promise<string | null> {
  const result = await pool.query<{ token: string }>(
    `SELECT token FROM "VerificationToken" 
     WHERE LOWER(email) = LOWER($1) AND type = 'EMAIL_VERIFY' 
     ORDER BY id DESC LIMIT 1`,
    [email]
  );
  return result.rows[0]?.token ?? null;
}

/**
 * ดึง Password Reset Token ล่าสุดจากตาราง VerificationToken ตาม email
 */
export async function getPasswordResetToken(email: string): Promise<string | null> {
  const result = await pool.query<{ token: string }>(
    `SELECT token FROM "VerificationToken" 
     WHERE LOWER(email) = LOWER($1) AND type = 'PASSWORD_RESET' 
     ORDER BY id DESC LIMIT 1`,
    [email]
  );
  return result.rows[0]?.token ?? null;
}

/**
 * สร้างผู้ใช้สำหรับการทดสอบโดยตรงผ่าน pg พร้อม Profile และ Subscription
 */
export async function createTestUser(
  email: string,
  hashedPassword: string,
  name: string = 'Test User',
  withProfile: boolean = false
): Promise<number> {
  const userRes = await pool.query<{ id: number }>(
    `INSERT INTO "User" (name, email, password, "emailVerified", role, "createdAt", "updatedAt")
     VALUES ($1, LOWER($2), $3, NOW(), 'USER', NOW(), NOW())
     RETURNING id`,
    [name, email, hashedPassword]
  );
  const userId = userRes.rows[0].id;

  // สร้าง Subscription เบื้องต้นให้ User
  await pool.query(
    `INSERT INTO "Subscription" ("userId", plan, status, "createdAt", "updatedAt")
     VALUES ($1, 'FREE', 'ACTIVE', NOW(), NOW())`,
    [userId]
  );

  // สร้าง Profile เพื่อให้คำนวณเป้าหมายแคลอรี/โปรตีนบน Dashboard ได้
  if (withProfile) {
    await pool.query(
      `INSERT INTO "Profile" ("userId", gender, age, weight, height, "exerciseLevel", goal, "createdAt", "updatedAt")
       VALUES ($1, 'MALE', 28, 75.0, 175.0, 'LIGHT', 'MAINTAIN', NOW(), NOW())`,
      [userId]
    );
  }

  return userId;
}

/**
 * ตรวจสอบสถานะการยืนยันอีเมลของผู้ใช้ (emailVerified)
 */
export async function getUserEmailVerified(email: string): Promise<Date | null> {
  const result = await pool.query<{ emailVerified: Date | null }>(
    `SELECT "emailVerified" FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return result.rows[0]?.emailVerified ?? null;
}

/**
 * ล้างข้อมูลที่สร้างขึ้นระหว่างการทดสอบ (Cleanup)
 */
export async function cleanupTestUser(email: string): Promise<void> {
  try {
    // ลบ VerificationToken
    await pool.query(
      `DELETE FROM "VerificationToken" WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    // หา User ID เพื่อลบข้อมูลที่เกี่ยวข้องทั้งหมด
    const userRes = await pool.query<{ id: number }>(
      `SELECT id FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;

      // ลบ FoodEntry ผ่าน Meal
      await pool.query(
        `DELETE FROM "FoodEntry" WHERE "mealId" IN (SELECT id FROM "Meal" WHERE "userId" = $1)`,
        [userId]
      );
      // ลบ Meal, DailySummary, Profile, Subscription, Account
      await pool.query(`DELETE FROM "Meal" WHERE "userId" = $1`, [userId]);
      await pool.query(`DELETE FROM "DailySummary" WHERE "userId" = $1`, [userId]);
      await pool.query(`DELETE FROM "Profile" WHERE "userId" = $1`, [userId]);
      await pool.query(`DELETE FROM "Account" WHERE "userId" = $1`, [userId]);
      await pool.query(`DELETE FROM "Subscription" WHERE "userId" = $1`, [userId]);
      // ลบ User
      await pool.query(`DELETE FROM "User" WHERE id = $1`, [userId]);
    }
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

/**
 * ปิด Database Connection Pool หลังจบการทดสอบ
 */
export async function closeDbPool(): Promise<void> {
  await pool.end();
}
