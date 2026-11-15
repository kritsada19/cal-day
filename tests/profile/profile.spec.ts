import { test, expect, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 👤 E2E Profile Flow
 * ============================================================================
 * ทดสอบหน้า /profile ว่าสามารถแสดงข้อมูลบัญชีและ Quick Actions ได้ถูกต้อง
 *
 * Test Cases:
 * 1. หน้า Profile โหลดได้และแสดง Heading Your account
 * 2. แสดง Section Profile summary
 * 3. มีลิงก์ Fill personal info / Edit profile
 * 4. มีปุ่ม Log out ใน Quick actions
 * 5. กด Log out แล้ว Redirect ไปหน้า Home
 * 6. มีลิงก์ Back to home ที่สามารถกลับหน้า /
 * 7. แสดง PLAN และ AI REMAINING ใน Account details
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

const testEmail = `profile_test_${timestamp}@example.com`;
const testPassword = 'Password123!';
const testName = 'Profile Test User';

// ============================================================================
// Helper: Login และเข้าสู่หน้า Profile
// ============================================================================

async function loginAndGotoProfile(page: Page) {

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
  // ขั้นตอนที่ 4: เข้าสู่หน้า Profile
  // ----------------------------------------------------
  await page.goto('/profile', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  // ตรวจสอบว่าเข้าสู่หน้า Profile สำเร็จ
  await expect(page).toHaveURL('/profile');
}

// ============================================================================
// Test Suite: Profile
// ============================================================================

test.describe('Profile', () => {

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

    // Login ด้วย Mock User และเข้าสู่หน้า Profile
    await loginAndGotoProfile(page);
  });

  // =========================================================================
  // Test Case 1: ตรวจสอบหน้า Profile
  // =========================================================================

  test('หน้า profile โหลดได้และแสดง heading "Your account"', async ({ page }) => {

    // ตรวจสอบ Heading หลักของหน้า Profile
    await expect(
      page.locator('h1').filter({
        hasText: /Your account|บัญชีของคุณ/i,
      })
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Test Case 2: ตรวจสอบ Profile summary
  // =========================================================================

  test('แสดง section "Profile summary"', async ({ page }) => {

    // ตรวจสอบว่ามี Heading Profile summary
    await expect(
      page.getByRole('heading', {
        name: /Profile summary|สรุปโปรไฟล์/i,
      })
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Test Case 3: ตรวจสอบลิงก์ Edit Profile
  // =========================================================================

  test('มีลิงก์ Fill personal info / Edit profile', async ({ page }) => {

    // ตรวจสอบ Heading ของหน้า Profile
    await expect(
      page.locator('h1').filter({
        hasText: /Your account|บัญชีของคุณ/i,
      })
    ).toBeVisible({ timeout: 10000 });

    // ค้นหาลิงก์ที่นำไปยังหน้า Profile Form
    const profileFormLinks = page.locator('a[href="/profile/form"]');

    // เลือกลิงก์แรกเพื่อทดสอบ
    const primaryProfileLink = profileFormLinks.first();

    // ตรวจสอบว่าลิงก์แสดงอยู่
    await expect(primaryProfileLink).toBeVisible({
      timeout: 10000,
    });

    // ตรวจสอบข้อความบนลิงก์
    await expect(primaryProfileLink).toHaveText(
      /Fill personal info|กรอกข้อมูลส่วนตัว|Edit profile|แก้ไขโปรไฟล์/i,
    );
  });

  // =========================================================================
  // Test Case 4: ตรวจสอบปุ่ม Logout
  // =========================================================================

  test('มีปุ่ม Log out ใน Quick actions', async ({ page }) => {

    // ตรวจสอบว่ามีปุ่มออกจากระบบ
    await expect(
      page.getByRole('button', {
        name: /Log out|ออกจากระบบ/i,
      })
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Test Case 5: ทดสอบ Logout Flow
  // =========================================================================

  test('กด Log out → redirect ไปหน้า home และ session หมด', async ({ page }) => {

    // กดปุ่มออกจากระบบ
    await page.getByRole('button', {
      name: /Log out|ออกจากระบบ/i,
    }).click();

    // ตรวจสอบว่า Redirect กลับหน้า Home
    await page.waitForURL('/', {
      timeout: 8000,
    });

    await expect(page).toHaveURL('/');

    // ตรวจสอบว่า Session ถูกลบแล้ว
    // โดยตรวจสอบว่าเมื่อกลับไปหน้า Profile จะไม่สามารถเข้าถึงได้
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/signin/);
  });

  // =========================================================================
  // Test Case 6: ตรวจสอบ Back to Home
  // =========================================================================

  test('มีลิงก์ Back to home ที่ไปหน้า /', async ({ page }) => {

    // ค้นหาลิงก์กลับหน้า Home
    const backLink = page.getByRole('link', {
      name: /Back to home|กลับไปหน้าแรก|Go to home|ไปที่หน้าแรก/i,
    }).first();

    // ตรวจสอบว่าลิงก์แสดงอยู่
    await expect(backLink).toBeVisible();

    // คลิกลิงก์และรอ Redirect
    await Promise.all([
      page.waitForURL('/'),
      backLink.click(),
    ]);

    // ตรวจสอบ URL หลัง Redirect
    await expect(page).toHaveURL('/');
  });

  // =========================================================================
  // Test Case 7: ตรวจสอบ Account Details
  // =========================================================================

  test('แสดง PLAN และ AI REMAINING ใน account info', async ({ page }) => {

    // ค้นหา Section Account details
    const accountDetails = page.getByRole('heading', {
      name: /Account details|รายละเอียดบัญชี/i,
    }).locator('..');

    // ตรวจสอบว่ามีข้อมูล Plan
    await expect(
      accountDetails.getByText(/Plan|แผน/i)
    ).toBeVisible();

    // ตรวจสอบว่ามีข้อมูล AI Remaining
    await expect(
      accountDetails.getByText(/AI remaining|AI ที่เหลือ/i)
    ).toBeVisible();
  });

  // =========================================================================
  // Cleanup: ลบ Mock User หลังจบการทดสอบ
  // =========================================================================

  test.afterAll(async () => {

    // ลบ User และข้อมูลที่เกี่ยวข้องออกจาก Database
    await cleanupTestUser(testEmail);
  });

});
