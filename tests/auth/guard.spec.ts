
import { test, expect, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 🔒 E2E Auth Flow: Protected Route Guard & Logout
 * ============================================================================
 * ทดสอบระบบ Authentication และการป้องกัน Routes ที่ต้อง Login
 *
 * Test Cases:
 *
 * Protected Route Guard:
 * 1. เข้าหน้า /dashboard โดยไม่ Login ต้องไม่เห็นข้อมูลส่วนตัว
 * 2. เข้าหน้า /meals/new โดยไม่ Login ต้อง Redirect ไปหน้า Sign in
 *
 * Logout:
 * 3. Login สำเร็จ → เข้าหน้า Dashboard → Clear Cookies
 *    → เข้าหน้า Protected Route อีกครั้งต้อง Redirect ไป Sign in
 *
 * Test Data:
 * - สร้าง Mock User จาก Timestamp เพื่อป้องกัน Email ซ้ำ
 * - ไม่ใช้ข้อมูลจาก .env
 * - สร้าง User พร้อม Profile ก่อนเริ่ม Logout Test
 *
 * Cleanup:
 * - ลบ Test User และข้อมูลที่เกี่ยวข้องหลังจบการทดสอบ
 * ============================================================================
 */

// ============================================================================
// Mock Data
// ============================================================================

// ใช้ Timestamp สร้าง Email ที่ไม่ซ้ำกันในแต่ละ Test Run
const timestamp = Date.now();

const testEmail = `auth_test_${timestamp}@example.com`;
const testPassword = 'Password123!';
const testName = 'Auth Test User';

// ============================================================================
// Helper: Login ด้วย Mock User ผ่าน UI
// ============================================================================

async function loginAsTestUser(page: Page) {

  // ----------------------------------------------------
  // ขั้นตอนที่ 1: เปิดหน้า Sign in
  // ----------------------------------------------------
  await page.goto('/signin');

  // ----------------------------------------------------
  // ขั้นตอนที่ 2: กรอกข้อมูล Mock User
  // ----------------------------------------------------
  await page.locator('#signin-email').fill(testEmail);
  await page.locator('#signin-password').fill(testPassword);

  // ----------------------------------------------------
  // ขั้นตอนที่ 3: กด Login
  // ----------------------------------------------------
  await page.getByRole('button', {
    name: /Log in|เข้าสู่ระบบ/i,
  }).click();

  // ตรวจสอบว่า Login สำเร็จและ Redirect ไปหน้า Home
  await expect(page).toHaveURL('/');
}

// ============================================================================
// Test Suite 1: Protected Route Guard
// ============================================================================

test.describe('Protected Route Guard', () => {

  // =========================================================================
  // Test Case 1: ป้องกันการเข้าถึง Dashboard โดยไม่ Login
  // =========================================================================

  test('เข้าหน้า /dashboard โดยไม่ login → ต้องไม่เห็นข้อมูล dashboard', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: เข้าหน้า Dashboard โดยไม่ Login
    // ----------------------------------------------------

    await page.goto('/dashboard');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ตรวจสอบสถานะการเข้าถึง
    // ----------------------------------------------------

    // ตรวจสอบว่า URL ถูก Redirect ไปหน้า Sign in หรือไม่
    const isRedirected = page.url().includes('/signin');

    // ตรวจสอบว่าข้อมูลส่วนตัวบน Dashboard แสดงอยู่หรือไม่
    const hasNutritionText = await page.getByRole('heading', {
      name: /Your nutrition overview|ภาพรวมโภชนาการของคุณ/i,
    }).isVisible().catch(() => false);

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
    // ----------------------------------------------------

    // ต้อง Redirect ไป Sign in หรือไม่แสดงข้อมูล Dashboard
    expect(isRedirected || !hasNutritionText).toBeTruthy();
  });

  // =========================================================================
  // Test Case 2: ป้องกันการเข้าถึง Meals โดยไม่ Login
  // =========================================================================

  test('เข้าหน้า /meals/new โดยไม่ login → redirect หน้า signin', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: เข้าหน้า Add New Meal โดยไม่ Login
    // ----------------------------------------------------

    await page.goto('/meals/new');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ตรวจสอบการ Redirect
    // ----------------------------------------------------

    // ผู้ใช้ที่ยังไม่ได้ Login ต้องถูกส่งไปหน้า Sign in
    await expect(page).toHaveURL(/\/signin/);
  });

});

// ============================================================================
// Test Suite 2: Logout Flow
// ============================================================================

test.describe('Logout', () => {

  // =========================================================================
  // Setup: สร้าง Mock User ก่อนเริ่มทดสอบ
  // =========================================================================

  test.beforeAll(async () => {

    // Hash Password ก่อนบันทึกลง Database
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // สร้าง Test User พร้อม Profile
    await createTestUser(
      testEmail,
      hashedPassword,
      testName,
      true,
    );
  });

  // =========================================================================
  // Test Case 3: ทดสอบ Logout และ Session Invalidation
  // =========================================================================

  test('logout แล้ว session หมด → redirect หน้า signin', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: Login ด้วย Mock User
    // ----------------------------------------------------

    await loginAsTestUser(page);

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: เข้าหน้า Dashboard
    // ----------------------------------------------------

    await page.goto('/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // ตรวจสอบว่า Login สำเร็จและ Dashboard แสดงข้อมูล
    await expect(
      page.getByRole('heading', {
        name: /Your nutrition overview|ภาพรวมโภชนาการของคุณ/i,
      })
    ).toBeVisible({ timeout: 8000 });

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: จำลองการสิ้นสุด Session
    // ----------------------------------------------------

    // Clear Cookies เพื่อจำลองการหมดอายุของ Session
    // ไม่ได้เรียก signOut() จาก NextAuth โดยตรง
    await page.context().clearCookies();

    // ----------------------------------------------------
    // ขั้นตอนที่ 4: ทดลองเข้าถึง Protected Route อีกครั้ง
    // ----------------------------------------------------

    await page.goto('/meals/new');

    // ----------------------------------------------------
    // ขั้นตอนที่ 5: ตรวจสอบว่า Session หมดแล้ว
    // ----------------------------------------------------

    // เมื่อไม่มี Session ต้องถูก Redirect ไปหน้า Sign in
    await expect(page).toHaveURL(/\/signin/);
  });

  // =========================================================================
  // Cleanup: ลบ Mock User หลังจบการทดสอบ
  // =========================================================================

  test.afterAll(async () => {

    // ลบ Test User และข้อมูลที่เกี่ยวข้องออกจาก Database
    await cleanupTestUser(testEmail);
  });

});
