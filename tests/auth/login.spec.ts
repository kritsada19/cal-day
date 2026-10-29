import { test, expect } from '@playwright/test';

// ============================================================
// 🔐 Auth — Login
// ทดสอบการเข้าสู่ระบบด้วย credentials (email + password)
// ============================================================

test.describe('Login', () => {

  // เปิดหน้า /signin ก่อนทุก test ใน describe block นี้
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('หน้า signin โหลดได้และมี form ครบ', async ({ page }) => {
    // ตรวจว่า URL ถูกต้อง
    await expect(page).toHaveURL('/signin');

    // ใช้ label เป็น selector เพื่อหลีกเลี่ยง strict mode และยอมรับทั้ง locale
    await expect(page.getByLabel(/Email address|ที่อยู่อีเมล/i)).toBeVisible();
    await expect(page.getByLabel(/Password|รหัสผ่าน/i)).toBeVisible();

    // ตรวจว่าปุ่มเข้าสู่ระบบมีอยู่ ทั้งในไทยและอังกฤษ
    await expect(page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i })).toBeVisible();
  });

  test('login สำเร็จ → redirect ไปหน้า /', async ({ page }) => {
    // กรอก email และ password ที่ถูกต้อง (มีอยู่ใน database จาก seed)
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill('test@example.com');
    await page.getByLabel(/Password|รหัสผ่าน/i).fill('password123');

    // กดปุ่ม Login
    await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();

    // หลัง login สำเร็จ ต้อง redirect ไปหน้า root
    await expect(page).toHaveURL('/');

    // ตรวจว่า NextAuth มี session ของผู้ใช้แล้วหรือไม่
    const sessionResponse = await page.request.get('/api/auth/session');
    const sessionData = await sessionResponse.json();

    console.log('Session API:', sessionData);

    // ต้องมีข้อมูล user ใน session
    expect(sessionData.user).toBeTruthy();
  });

  test('login ล้มเหลว (password ผิด) → คงอยู่หน้า /signin', async ({ page }) => {
    // กรอก email ถูก แต่ password ผิด
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill('test@example.com');
    await page.getByLabel(/Password|รหัสผ่าน/i).fill('wrongpassword');

    // กดปุ่ม Login
    await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();

    // ต้องยังอยู่หน้า /signin (ไม่ redirect)
    await expect(page).toHaveURL('/signin');
  });

  test('login ล้มเหลว (email ไม่มีในระบบ) → คงอยู่หน้า /signin', async ({ page }) => {
    // กรอก email ที่ไม่เคยสมัครในระบบ
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill('notexist@example.com');
    await page.getByLabel(/Password|รหัสผ่าน/i).fill('somepassword');

    // กดปุ่ม Login
    await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();

    // ต้องยังอยู่หน้า /signin
    await expect(page).toHaveURL('/signin');
  });

  test('มีลิงก์ไปหน้า signup', async ({ page }) => {
    // ตรวจว่ามีลิงก์สร้างบัญชีหรือ Create an account ชี้ไป /signup
    const link = page.getByRole('link', { name: /Create an account|สร้างบัญชี/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/signup');
  });

  test('มีลิงก์ไปหน้า forgot password', async ({ page }) => {
    const link = page.getByRole('link', { name: /Forgot password\?|ลืมรหัสผ่าน/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/forgot-password');
  });

});