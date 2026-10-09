import { test, expect } from '@playwright/test';

// ============================================================
// 📝 Auth — Register (Signup)
// ทดสอบการสมัครสมาชิกใหม่ผ่านหน้า /signup
// ============================================================

test.describe('Register', () => {

  // เปิดหน้า /signup ก่อนทุก test
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('หน้า signup โหลดได้และมี form ครบ', async ({ page }) => {
    // ตรวจว่า URL ถูกต้อง
    await expect(page).toHaveURL('/signup');

    // ตรวจว่า input ทุกช่องมีอยู่บนหน้า
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter a password')).toBeVisible();
    await expect(page.getByPlaceholder('Repeat your password')).toBeVisible();

    // ตรวจว่าปุ่ม Create account มีอยู่
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('กรอก password ไม่ตรงกัน → แสดง error message และปุ่ม disabled', async ({ page }) => {
    // กรอกข้อมูลทั่วไป
    await page.getByPlaceholder('Enter your full name').fill('Test User');
    await page.getByPlaceholder('Enter your email address').fill('new@example.com');
    await page.getByPlaceholder('Enter a password').fill('password123');

    // กรอก confirm password ที่ไม่ตรงกัน
    await page.getByPlaceholder('Repeat your password').fill('differentpassword');

    // ต้องเห็น error message ว่า password ไม่ตรงกัน (แสดงทันที ไม่ต้อง submit)
    await expect(page.getByText('Passwords do not match')).toBeVisible();

    // ปุ่มต้อง disabled เพราะ password ไม่ตรง
    await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();
  });

  test('สมัครสำเร็จ → แสดง toast success', async ({ page }) => {
    // ใช้ email ที่ unique เพื่อไม่ซ้ำกับ test อื่น
    const uniqueEmail = `newuser_${Date.now()}@example.com`;

    // กรอกข้อมูลที่ถูกต้องครบ
    await page.getByPlaceholder('Enter your full name').fill('New Test User');
    await page.getByPlaceholder('Enter your email address').fill(uniqueEmail);
    await page.getByPlaceholder('Enter a password').fill('SecurePass2026');
    await page.getByPlaceholder('Repeat your password').fill('SecurePass2026');

    // กดสมัคร
    await page.getByRole('button', { name: 'Create account' }).click();

    // ต้องเห็น toast แจ้งว่าสร้าง account สำเร็จ (sonner toast)
    await expect(page.getByText(/Account created successfully/)).toBeVisible({ timeout: 5000 });
  });

  test('มีลิงก์กลับไปหน้า signin', async ({ page }) => {
    // ตรวจว่ามีลิงก์ Back to log in ชี้ไป /signin
    const link = page.getByRole('link', { name: 'Back to log in' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/signin');
  });

});
