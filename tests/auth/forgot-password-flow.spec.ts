import { test, expect } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  getPasswordResetToken,
  cleanupTestUser,
  closeDbPool,
} from '../helpers/db';

/**
 * ============================================================================
 * 🔐 E2E Auth Flow: Forgot Password → Reset Password → Login
 * ============================================================================
 * ขั้นตอนการทดสอบ:
 * 1. เตรียมข้อมูลผู้ใช้ทดสอบใน Database (User + Active Subscription)
 * 2. ไปที่หน้า /forgot-password กรอก email แล้วกดขอ reset link
 * 3. ดึง Token ประเภท PASSWORD_RESET จากฐานข้อมูลผ่าน helper
 * 4. ไปที่หน้า /reset-password?token=${token} กรอกรหัสผ่านใหม่
 * 5. ตรวจสอบว่า redirect ไปหน้า /signin พร้อม toast แจ้งเตือนสำเร็จ
 * 6. ทดลองเข้าสู่ระบบด้วยรหัสผ่านใหม่ ตรวจสอบว่าเข้าได้จริง
 * ============================================================================
 */

test.describe('Auth Flow: Forgot Password → Reset Password', () => {
  const timestamp = Date.now();
  const testEmail = `forgot_test_${timestamp}@example.com`;
  const initialPassword = 'OldPassword123!';
  const newPassword = 'NewPassword2026!';
  const testName = 'Forgot Test User';

  // เตรียมผู้ใช้ในฐานข้อมูลก่อนรันเทส
  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    await createTestUser(testEmail, hashedPassword, testName);
  });

  // ล้างข้อมูลหลังจบการทดสอบ
  test.afterAll(async () => {
    await cleanupTestUser(testEmail);
    await closeDbPool();
  });

  test('สามารถขอ reset password, ตั้งรหัสผ่านใหม่ และ login ด้วยรหัสใหม่ได้สำเร็จ', async ({ page }) => {
    // ----------------------------------------------------
    // ขั้นตอนที่ 1: ขอ Reset Password ที่หน้า /forgot-password
    // ----------------------------------------------------
    await page.goto('/forgot-password');

    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(testEmail);

    const forgotResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/auth/forgot-password') && res.status() === 200
    );

    await page.getByRole('button', { name: /Send reset link|ส่งลิงก์รีเซ็ตรหัสผ่าน/i }).click();
    await forgotResponsePromise;

    // ตรวจสอบ Toast ตอบรับ (แยก message เฉพาะ ไม่ซ้ำกับข้อความบนปุ่ม submit)
    const notifications = page.getByRole('region', { name: /notifications/i });
    await expect(notifications).toContainText(
      /ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว|Password reset link has been sent to your email/i,
      { timeout: 10000 }
    );

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ดึง Reset Token จาก DB
    // ----------------------------------------------------
    const resetToken = await getPasswordResetToken(testEmail);
    expect(resetToken).toBeTruthy();

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: ไปที่หน้า /reset-password พร้อม token และตั้งรหัสผ่านใหม่
    // ----------------------------------------------------
    await page.goto(`/reset-password?token=${resetToken}`);

    // กรอกรหัสผ่านใหม่
    await page.locator('#reset-password').fill(newPassword);
    await page.locator('#reset-confirm-password').fill(newPassword);

    const resetResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/auth/reset-password') && res.status() === 200
    );

    await page.getByRole('button', { name: /Reset password|รีเซ็ตรหัสผ่าน/i }).click();
    await resetResponsePromise;

    // ระบบจะแสดง Toast สำเร็จ และ redirect ไปหน้า /signin ภายใน 1.5 วินาที
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });

    // ----------------------------------------------------
    // ขั้นตอนที่ 4: ล็อกอินด้วยรหัสผ่านใหม่
    // ----------------------------------------------------
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(testEmail);
    await page.getByLabel(/Password|รหัสผ่าน/i).fill(newPassword);
    await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();

    // ต้อง redirect ไปหน้าแรกหลังล็อกอินสำเร็จ
    await expect(page).toHaveURL('/');

    // ตรวจสอบความถูกต้องของ Session
    const sessionRes = await page.request.get('/api/auth/session');
    const sessionData = await sessionRes.json();
    expect(sessionData.user?.email).toBe(testEmail);
  });
});

