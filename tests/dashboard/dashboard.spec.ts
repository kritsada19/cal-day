import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 🏠 Dashboard
// ทดสอบหน้า dashboard หลังจาก user login สำเร็จ
// ============================================================

// ──────────────────────────────────────────────
// Helper: ล็อกอินและไปหน้า dashboard
// ──────────────────────────────────────────────
async function loginAndGotoDashboard(page: Page) {
  await page.goto('/signin');
  await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill('test@example.com');
  await page.getByLabel(/Password|รหัสผ่าน/i).fill('password123');
  await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();
  await page.waitForURL('/');
  await page.goto('/dashboard');
}

test.describe('Dashboard', () => {

  // login ก่อนทุก test ใน group นี้
  test.beforeEach(async ({ page }) => {
    await loginAndGotoDashboard(page);
  });

  test('หน้า dashboard โหลดได้และแสดง heading หลัก', async ({ page }) => {
    // ตรวจว่า URL ถูกต้อง
    await expect(page).toHaveURL('/dashboard');

    // ตรวจว่า heading หลักแสดงอยู่ทั้งภาษาไทยและอังกฤษ
    await expect(page.getByRole('heading', { name: /ภาพรวมโภชนาการของคุณ|Your nutrition overview/i })).toBeVisible({ timeout: 8000 });
  });

  test('มีปุ่ม Add meal ที่คลิกแล้วไปหน้า /meals/new', async ({ page }) => {
    // รอให้ dashboard โหลดเสร็จก่อน
    await page.waitForLoadState('networkidle');

    // ตรวจว่าลิงก์เพิ่มมื้ออาหารมีอยู่บนหน้า ทั้งภาษาไทยและอังกฤษ
    const addMealLink = page.getByRole('link', { name: /เพิ่มมื้ออาหาร|Add meal/i });
    await expect(addMealLink).toBeVisible();

    // คลิกแล้วตรวจว่า URL เปลี่ยนไปหน้า meals/new
    await addMealLink.click();
    await expect(page).toHaveURL('/meals/new');
  });

  test('มีลิงก์ View profile ที่คลิกแล้วไปหน้า /profile', async ({ page }) => {
    // รอให้ dashboard โหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่าลิงก์ดูโปรไฟล์มีอยู่ ทั้งภาษาไทยและอังกฤษ
    const profileLink = page.getByRole('link', { name: /ดูโปรไฟล์|View profile/i });
    await expect(profileLink).toBeVisible();

    // คลิกแล้วตรวจว่าไปหน้า profile
    await profileLink.click();
    await expect(page).toHaveURL('/profile');
  });

  test('แสดง label Calories บน progress card', async ({ page }) => {
    // รอให้ fetch API profile เสร็จสิ้น
    await page.waitForLoadState('networkidle');

    // ตรวจว่ามี section แสดงแคลอรีอยู่บน dashboard
    // Accept ทั้งคำภาษาไทยและอังกฤษ เพราะหน้าแสดงตาม locale
    await expect(page.getByText(/^(Calories|แคลอรี่)$/i)).toBeVisible({ timeout: 8000 });
  });

  test('แสดง label Daily dashboard ใต้ heading', async ({ page }) => {
    // ตรวจว่ามีข้อความ subheading ไม่ว่าจะเป็นไทยหรืออังกฤษ
    await expect(page.getByText(/แดชบอร์ดรายวัน|Daily dashboard/i)).toBeVisible({ timeout: 5000 });
  });

});
