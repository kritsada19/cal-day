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
  await page.getByPlaceholder('Enter your email address').fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
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

    // ตรวจว่า heading "Your nutrition overview" แสดงอยู่
    await expect(page.getByRole('heading', { name: 'Your nutrition overview' })).toBeVisible({ timeout: 8000 });
  });

  test('มีปุ่ม Add meal ที่คลิกแล้วไปหน้า /meals/new', async ({ page }) => {
    // รอให้ dashboard โหลดเสร็จก่อน
    await page.waitForLoadState('networkidle');

    // ตรวจว่าลิงก์ Add meal มีอยู่บนหน้า
    const addMealLink = page.getByRole('link', { name: 'Add meal' });
    await expect(addMealLink).toBeVisible();

    // คลิกแล้วตรวจว่า URL เปลี่ยนไปหน้า meals/new
    await addMealLink.click();
    await expect(page).toHaveURL('/meals/new');
  });

  test('มีลิงก์ View profile ที่คลิกแล้วไปหน้า /profile', async ({ page }) => {
    // รอให้ dashboard โหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่าลิงก์ View profile มีอยู่
    const profileLink = page.getByRole('link', { name: 'View profile' });
    await expect(profileLink).toBeVisible();

    // คลิกแล้วตรวจว่าไปหน้า profile
    await profileLink.click();
    await expect(page).toHaveURL('/profile');
  });

  test('แสดง label Calories บน progress card', async ({ page }) => {
    // รอให้ fetch API profile เสร็จสิ้น
    await page.waitForLoadState('networkidle');

    // ตรวจว่ามี section แสดงแคลอรีอยู่บน dashboard
    // (มีทั้งกรณีที่ยังไม่ได้ตั้ง profile และที่ตั้งแล้ว)
    await expect(page.getByText('Calories', { exact: true })).toBeVisible({ timeout: 8000 });
  });

  test('แสดง label Daily dashboard ใต้ heading', async ({ page }) => {
    // ตรวจว่ามีข้อความ "Daily dashboard" ที่เป็น subheading
    await expect(page.getByText('Daily dashboard')).toBeVisible({ timeout: 5000 });
  });

});
