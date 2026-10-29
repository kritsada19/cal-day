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

    // ตรวจว่า input ทุกช่องมีอยู่บนหน้า และรองรับทั้งภาษาไทยและอังกฤษ
    await expect(page.getByLabel(/Full name|ชื่อเต็ม/i)).toBeVisible();
    await expect(page.getByLabel(/Email address|ที่อยู่อีเมล/i)).toBeVisible();
    await expect(page.locator('#signup-password')).toBeVisible();
    await expect(page.locator('#signup-confirm-password')).toBeVisible();

    // ตรวจว่าปุ่มสร้างบัญชีมีอยู่ทั้งในไทยและอังกฤษ
    await expect(page.getByRole('button', { name: /Create account|Create an account|สร้างบัญชี/i })).toBeVisible();
  });

  test('กรอก password ไม่ตรงกัน → แสดง error message และปุ่ม disabled', async ({ page }) => {
    // กรอกข้อมูลทั่วไป
    await page.getByLabel(/Full name|ชื่อเต็ม/i).fill('Test User');
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill('new@example.com');
    await page.locator('#signup-password').fill('password123');

    // กรอก confirm password ที่ไม่ตรงกัน
    await page.locator('#signup-confirm-password').fill('differentpassword');

    // ต้องเห็น error message ว่า password ไม่ตรงกัน (แสดงทันที ไม่ต้อง submit)
    await expect(page.getByText(/Passwords do not match|รหัสผ่านไม่ตรงกัน/i)).toBeVisible();

    // ปุ่มต้อง disabled เพราะ password ไม่ตรง
    await expect(page.getByRole('button', { name: /Create account|Create an account|สร้างบัญชี/i })).toBeDisabled();
  });

  test('สมัครสำเร็จ → แสดง toast success', async ({ page }) => {
    // ใช้ email ที่ unique เพื่อไม่ซ้ำกับ test อื่น
    const uniqueEmail = `newuser_${Date.now()}@example.com`;

    // รอ response ของ signup ก่อนตรวจ toast เพื่อให้ test ไม่ race กับ async request
    const signupResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/signup') && response.status() === 201
    );

    // กรอกข้อมูลที่ถูกต้องครบ
    await page.getByLabel(/Full name|ชื่อเต็ม/i).fill('New Test User');
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(uniqueEmail);
    await page.locator('#signup-password').fill('SecurePass2026');
    await page.locator('#signup-confirm-password').fill('SecurePass2026');

    // กดสมัคร
    await page.getByRole('button', { name: /Create account|Create an account|สร้างบัญชี/i }).click();
    await signupResponse;

    // Sonner toast จะอยู่ใน region "Notifications" ไม่ใช่ text node ในฟอร์ม
    const notifications = page.getByRole('region', { name: /notifications/i });
    await expect(notifications).toContainText(/สร้างผู้ใช้สำเร็จ|User created successfully|Account created successfully|สร้างบัญชีสำเร็จ/i, { timeout: 10000 });
  });

  test('มีลิงก์กลับไปหน้า signin', async ({ page }) => {
    // ตรวจว่ามีลิงก์กลับไปหน้าเข้าสู่ระบบหรือ Back to log in ชี้ไป /signin
    const link = page.getByRole('link', { name: /Back to log in|กลับไปหน้าเข้าสู่ระบบ/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/signin');
  });

});
