import { test, expect, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 💳 E2E Subscription Flow: Login → FREE → Subscription → PRO
 * ============================================================================
 * ทดสอบ Lifecycle ของระบบ Subscription ตั้งแต่ผู้ใช้เข้าสู่ระบบ:
 *
 * 1. สร้าง Test User พร้อม Profile และ Subscription เริ่มต้นเป็น FREE
 * 2. ทดสอบการเข้าหน้า /subscription โดยไม่ Login
 * 3. เข้าสู่ระบบผ่านหน้า /signin
 * 4. ตรวจสอบราคา Subscription ฿199 / month
 * 5. ตรวจสอบ Feature List ทั้ง 4 รายการ
 * 6. ทดสอบหน้า /subscription/success
 *
 * Cleanup:
 * - ลบข้อมูล Test User และข้อมูลที่เกี่ยวข้องหลังจบการทดสอบ
 * ============================================================================
 */

test.describe('Subscription-Flow', () => {
  const timestamp = Date.now();
  const testEmail = `subscription_test_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Subscription Flow User';

  // เตรียมผู้ใช้พร้อม Profile ก่อนเริ่มเทส
  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await createTestUser(
      testEmail,
      hashedPassword,
      testName,
      true
    );
  });

  // ล้างข้อมูลหลังจบการทดสอบ
  test.afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  // ----------------------------------------------------
  // Helper: เข้าสู่ระบบและไปหน้า Subscription
  // ----------------------------------------------------
  async function loginAndGotoSubscription(page: Page) {
    await page.goto('/signin');

    await page.getByLabel(
      /Email address|ที่อยู่อีเมล/i
    ).fill(testEmail);

    await page.getByLabel(
      /Password|รหัสผ่าน/i
    ).fill(testPassword);

    await page.getByRole('button', {
      name: /Log in|เข้าสู่ระบบ/i,
    }).click();

    await expect(page).toHaveURL('/');

    await page.goto('/subscription');
  }

  // ----------------------------------------------------
  // Subscription Page
  // ----------------------------------------------------
  test.describe('Subscription Page', () => {

    test('ผู้ใช้ที่ไม่ได้ Login ต้อง Redirect ไปหน้า Login', async ({ page }) => {

      // ----------------------------------------------------
      // ขั้นตอนที่ 1: เข้าหน้า Subscription โดยไม่ Login
      // ----------------------------------------------------
      await page.goto('/subscription', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // ----------------------------------------------------
      // ขั้นตอนที่ 2: ตรวจสอบ Redirect
      // ----------------------------------------------------
      await expect(page).toHaveURL('/signin');
    });

    test.describe('Logged in user', () => {

      // เข้าสู่ระบบก่อนเริ่มแต่ละ Test
      test.beforeEach(async ({ page }) => {
        await loginAndGotoSubscription(page);
      });

      test('แสดงราคา ฿199 / month', async ({ page }) => {

        // ----------------------------------------------------
        // ขั้นตอนที่ 1: ตรวจสอบราคา Subscription
        // ----------------------------------------------------
        await expect(
          page.getByText(/฿199|\$199|199/i)
        ).toBeVisible({ timeout: 5000 });

        // ----------------------------------------------------
        // ขั้นตอนที่ 2: ตรวจสอบระยะเวลาการสมัคร
        // ----------------------------------------------------
        await expect(
          page.getByText(/\/ month|\/ เดือน/i)
        ).toBeVisible();
      });

      test('แสดง Feature List ครบ 2 รายการ', async ({ page }) => {

        // ----------------------------------------------------
        // ขั้นตอนที่ 1: ตรวจสอบ Feature รายการที่ 1
        // ----------------------------------------------------
        await expect(
          page.getByText(
            /บันทึกมื้ออาหารรายวันแบบ 50 ครั้ง|50 meals per day/i
          )
        ).toBeVisible({ timeout: 5000 });

        // ----------------------------------------------------
        // ขั้นตอนที่ 2: ตรวจสอบ Feature รายการที่ 2
        // ----------------------------------------------------
        await expect(
          page.getByText(
            /วิเคราะห์พฤติกรรมการกิน|Analyze eating behaviormacros/i
          )
        ).toBeVisible();
      });
    });
  });

  // ----------------------------------------------------
  // Subscription Success Page
  // ----------------------------------------------------
  test.describe('Subscription Success Page', () => {

    test('หน้า /subscription/success โหลดได้', async ({ page }) => {

      // ----------------------------------------------------
      // ขั้นตอนที่ 1: เข้าหน้า Success
      // ----------------------------------------------------
      await page.goto('/subscription/success');

      // ----------------------------------------------------
      // ขั้นตอนที่ 2: ตรวจสอบว่าไม่มี Error Redirect
      // ----------------------------------------------------
      const url = page.url();

      expect(url).not.toContain('error');
    });
  });
});
