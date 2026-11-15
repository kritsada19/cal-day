import { test, expect } from '@playwright/test';
import {
  getVerificationToken,
  getUserEmailVerified,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 📝 E2E Auth Flow: Signup → Verify Email → Login
 * ============================================================================
 * ทดสอบ Full Lifecycle ของการลงทะเบียนและเข้าใช้งาน:
 * 1. ผู้ใช้กรอกฟอร์มสมัครสมาชิกหน้า /signup
 * 2. ระบบสร้าง Token สำหรับ Verify และบันทึกใน Database
 * 3. ดึง Token ผ่าน `pg` helper แล้วเข้า URL ยืนยันอีเมล (/api/auth/email-verify?token=...)
 * 4. นำบัญชีที่ยืนยันแล้วไปเข้าสู่ระบบที่ /signin
 * 5. ตรวจสอบว่า redirect ไปหน้าแรกและมี Session ถูกต้อง
 * ============================================================================
 */

test.describe('Auth Flow: Signup → Verify Email → Login', () => {

  const timestamp = Date.now();
  const testEmail = `flow_test_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Flow Test User';

  // ล้างข้อมูลทดสอบใน Database หลังการทดสอบเสร็จสิ้น
  test.afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  test('สามารถ Signup, Verify Email และ Login เข้าสู่ระบบได้สมบูรณ์', async ({ page }) => {
    // ----------------------------------------------------
    // ขั้นตอนที่ 1: สมัครสมาชิก (Signup)
    // ----------------------------------------------------
    await page.goto('/signup');

    await page.getByLabel(/Full name|ชื่อเต็ม/i).fill(testName);
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(testEmail);
    await page.locator('#signup-password').fill(testPassword);
    await page.locator('#signup-confirm-password').fill(testPassword);

    // รอ response จาก endpoint /api/auth/signup เป็น status 201
    const signupResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/auth/signup') && res.status() === 201
    );

    await page.getByRole('button', { name: /Create account|สร้างบัญชี/i }).click();
    await signupResponsePromise;

    // ตรวจสอบ Toast แจ้งเตือนว่าสร้างบัญชีสำเร็จ
    const notifications = page.getByRole('region', { name: /notifications/i });
    await expect(notifications).toContainText(/สำเร็จ|successfully/i, { timeout: 10000 });

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ดึง Verification Token จาก DB (ผ่าน pg helper)
    // ----------------------------------------------------
    const token = await getVerificationToken(testEmail);
    expect(token).toBeTruthy();

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: กดยืนยันอีเมล (Verify Email)
    // ----------------------------------------------------
    // เปิด URL ยืนยันอีเมล ซึ่ง API จะ redirect ไปหน้า /verify-email?status=success
    await page.goto(`/api/auth/email-verify?token=${token}`);
    await expect(page).toHaveURL(/.*\/verify-email\?status=success/);

    // ตรวจสอบว่าในฐานข้อมูลมีการอัปเดตฟิลด์ emailVerified แล้วจริง
    const emailVerified = await getUserEmailVerified(testEmail);
    expect(emailVerified).not.toBeNull();

    // ----------------------------------------------------
    // ขั้นตอนที่ 4: ล็อกอินด้วยบัญชีที่ผ่านการยืนยันแล้ว
    // ----------------------------------------------------
    await page.goto('/signin');

    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(testEmail);
    await page.getByLabel(/Password|รหัสผ่าน/i).fill(testPassword);
    await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();

    // ต้อง redirect ไปหน้าแรกหลังล็อกอินสำเร็จ
    await expect(page).toHaveURL('/');

    // ตรวจสอบว่ามี session ในฝั่ง client
    const sessionRes = await page.request.get('/api/auth/session');
    const sessionData = await sessionRes.json();
    expect(sessionData.user?.email).toBe(testEmail);
  });
});
