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

    // ตรวจว่า input email และ password มีอยู่บนหน้า
    await expect(page.getByPlaceholder('Enter your email address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();

    // ตรวจว่าปุ่ม Log in มีอยู่
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('login สำเร็จ → redirect ไปหน้า /', async ({ page }) => {
    // กรอก email และ password ที่ถูกต้อง (มีอยู่ใน database จาก seed)
    await page.getByPlaceholder('Enter your email address').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');

    // กดปุ่ม Login
    await page.getByRole('button', { name: 'Log in' }).click();

    // หลัง login สำเร็จ ต้อง redirect ไปหน้า root
    await expect(page).toHaveURL('/');
  });

  test('login ล้มเหลว (password ผิด) → คงอยู่หน้า /signin', async ({ page }) => {
    // กรอก email ถูก แต่ password ผิด
    await page.getByPlaceholder('Enter your email address').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');

    // กดปุ่ม Login
    await page.getByRole('button', { name: 'Log in' }).click();

    // ต้องยังอยู่หน้า /signin (ไม่ redirect)
    await expect(page).toHaveURL('/signin');
  });

  test('login ล้มเหลว (email ไม่มีในระบบ) → คงอยู่หน้า /signin', async ({ page }) => {
    // กรอก email ที่ไม่เคยสมัครในระบบ
    await page.getByPlaceholder('Enter your email address').fill('notexist@example.com');
    await page.getByPlaceholder('Enter your password').fill('somepassword');

    // กดปุ่ม Login
    await page.getByRole('button', { name: 'Log in' }).click();

    // ต้องยังอยู่หน้า /signin
    await expect(page).toHaveURL('/signin');
  });

  test('มีลิงก์ไปหน้า signup', async ({ page }) => {
    // ตรวจว่ามีลิงก์ Create an account ชี้ไป /signup
    const link = page.getByRole('link', { name: 'Create an account' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/signup');
  });

});