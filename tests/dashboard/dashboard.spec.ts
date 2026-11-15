
import { test, expect, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 🏠 E2E Dashboard Flow
 * ============================================================================
 * ทดสอบหน้า /dashboard หลังจากผู้ใช้ Login สำเร็จ
 *
 * Test Cases:
 * 1. หน้า Dashboard โหลดได้และแสดง Heading หลัก
 * 2. มีปุ่ม Add meal และสามารถไปหน้า /meals/new ได้
 * 3. มีลิงก์ View profile และสามารถไปหน้า /profile ได้
 * 4. แสดง Label Calories บน Progress Card
 * 5. แสดง Label Daily dashboard ใต้ Heading
 *
 * Test Data:
 * - สร้าง Mock User จาก Timestamp เพื่อป้องกัน Email ซ้ำ
 * - ไม่ใช้ข้อมูลจาก .env
 * - สร้าง User พร้อม Profile ก่อนเริ่มทดสอบ
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

const testEmail = `dashboard_test_${timestamp}@example.com`;
const testPassword = 'Password123!';
const testName = 'Dashboard Test User';

// ============================================================================
// Helper: Login และเข้าสู่หน้า Dashboard
// ============================================================================

async function loginAndGotoDashboard(page: Page) {

  // ----------------------------------------------------
  // ขั้นตอนที่ 1: เปิดหน้า Sign in
  // ----------------------------------------------------
  await page.goto('/signin');

  // ----------------------------------------------------
  // ขั้นตอนที่ 2: กรอกข้อมูล Mock User
  // ----------------------------------------------------
  await page.getByLabel(/Email address|ที่อยู่อีเมล/i)
    .fill(testEmail);

  await page.getByLabel(/Password|รหัสผ่าน/i)
    .fill(testPassword);

  // ----------------------------------------------------
  // ขั้นตอนที่ 3: กด Login
  // ----------------------------------------------------
  await page.getByRole('button', {
    name: /Log in|เข้าสู่ระบบ/i,
  }).click();

  // ตรวจสอบว่า Login สำเร็จและ Redirect ไปหน้า Home
  await expect(page).toHaveURL('/');

  // ----------------------------------------------------
  // ขั้นตอนที่ 4: เข้าสู่หน้า Dashboard
  // ----------------------------------------------------
  await page.goto('/dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  // ตรวจสอบว่าเข้าสู่หน้า Dashboard สำเร็จ
  await expect(page).toHaveURL('/dashboard');
}

// ============================================================================
// Test Suite: Dashboard
// ============================================================================

test.describe('Dashboard', () => {

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
  // Setup: Login ก่อนเริ่มแต่ละ Test
  // =========================================================================

  test.beforeEach(async ({ page }) => {

    // Login ด้วย Mock User และเข้าสู่หน้า Dashboard
    await loginAndGotoDashboard(page);
  });

  // =========================================================================
  // Test Case 1: ตรวจสอบหน้า Dashboard
  // =========================================================================

  test('หน้า dashboard โหลดได้และแสดง heading หลัก', async ({ page }) => {

    // ตรวจสอบ URL ของหน้า Dashboard
    await expect(page).toHaveURL('/dashboard');

    // ตรวจสอบ Heading หลักทั้งภาษาไทยและอังกฤษ
    await expect(
      page.getByRole('heading', {
        name: /ภาพรวมโภชนาการของคุณ|Your nutrition overview/i,
      })
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Test Case 2: ตรวจสอบ Add Meal Navigation
  // =========================================================================

  test('มีปุ่ม Add meal ที่คลิกแล้วไปหน้า /meals/new', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: รอให้ Dashboard โหลดข้อมูลเสร็จ
    // ----------------------------------------------------

    await page.waitForLoadState('networkidle');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ค้นหาลิงก์ Add Meal
    // ----------------------------------------------------

    const addMealLink = page.getByRole('link', {
      name: /เพิ่มมื้ออาหาร|Add meal/i,
    });

    // ตรวจสอบว่าลิงก์แสดงอยู่
    await expect(addMealLink).toBeVisible();

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: คลิกลิงก์ Add Meal
    // ----------------------------------------------------

    await addMealLink.click();

    // ตรวจสอบว่า Redirect ไปหน้า Add New Meal สำเร็จ
    await expect(page).toHaveURL('/meals/new');
  });

  // =========================================================================
  // Test Case 3: ตรวจสอบ View Profile Navigation
  // =========================================================================

  test('มีลิงก์ View profile ที่คลิกแล้วไปหน้า /profile', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: รอให้ Dashboard โหลดข้อมูลเสร็จ
    // ----------------------------------------------------

    await page.waitForLoadState('networkidle');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ค้นหาลิงก์ View Profile
    // ----------------------------------------------------

    const profileLink = page.getByRole('link', {
      name: /ดูโปรไฟล์|View profile/i,
    });

    // ตรวจสอบว่าลิงก์แสดงอยู่
    await expect(profileLink).toBeVisible();

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: คลิกลิงก์ View Profile
    // ----------------------------------------------------

    await profileLink.click();

    // ตรวจสอบว่า Redirect ไปหน้า Profile สำเร็จ
    await expect(page).toHaveURL('/profile');
  });

  // =========================================================================
  // Test Case 4: ตรวจสอบ Calories Progress Card
  // =========================================================================

  test('แสดง label Calories บน progress card', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: รอให้ API Profile โหลดข้อมูลเสร็จ
    // ----------------------------------------------------

    await page.waitForLoadState('networkidle');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ตรวจสอบ Label Calories
    // ----------------------------------------------------

    // รองรับทั้งภาษาไทยและอังกฤษตาม Locale
    await expect(
      page.getByText(/^(Calories|แคลอรี่)$/i)
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Test Case 5: ตรวจสอบ Daily Dashboard Subheading
  // =========================================================================

  test('แสดง label Daily dashboard ใต้ heading', async ({ page }) => {

    // ตรวจสอบข้อความ Subheading ทั้งภาษาไทยและอังกฤษ
    await expect(
      page.getByText(/แดชบอร์ดรายวัน|Daily dashboard/i)
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Cleanup: ลบ Mock User หลังจบการทดสอบ
  // =========================================================================

  test.afterAll(async () => {

    // ลบ Test User และข้อมูลที่เกี่ยวข้องออกจาก Database
    await cleanupTestUser(testEmail);
  });

});
