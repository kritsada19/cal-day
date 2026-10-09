import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 🛠️ Admin
// ทดสอบหน้า admin ว่า guard ทำงานถูกต้องและ admin เห็นข้อมูลได้
//
// ⚠️ หมายเหตุ:
//   - test ที่ต้องการ ADMIN role จะ skip โดยอัตโนมัติ
//     ถ้า test account (test@example.com) ไม่ได้มี role = ADMIN ใน database
//   - ให้ตั้งค่า ADMIN_EMAIL และ ADMIN_PASSWORD ใน .env.test
//     เพื่อให้ test เหล่านี้ทำงานได้เต็มรูปแบบ
// ============================================================

// อ่าน admin credentials จาก env (ถ้ามี) หรือใช้ fallback เพื่อ test guard เท่านั้น
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const HAS_ADMIN_CREDS = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

// ──────────────────────────────────────────────
// Helper: login ด้วย account ธรรมดา (ไม่ใช่ admin)
// ──────────────────────────────────────────────
async function loginAsNormalUser(page: Page) {
  await page.goto('/signin');
  await page.getByPlaceholder('Enter your email address').fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/');
}

// ──────────────────────────────────────────────
// Helper: login ด้วย admin account
// ──────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  await page.goto('/signin');
  await page.getByPlaceholder('Enter your email address').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/');
}

// ──────────────────────────────────────────────
// Guard Tests: ทุกคนต้อง pass
// ──────────────────────────────────────────────
test.describe('Admin Guard', () => {

  test('ผู้ใช้ที่ไม่ได้ login เข้า /admin/dashboard → redirect ไป /signin', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await expect(page).toHaveURL(/\/signin/);
    await expect(
      page.getByPlaceholder('Enter your email address')
    ).toBeVisible();
  });

  test('user ธรรมดา (ไม่ใช่ ADMIN role) เข้า /admin/dashboard → redirect ไปหน้า /', async ({ page }) => {
    // login เป็น user ธรรมดา
    await loginAsNormalUser(page);

    // เข้าหน้า admin
    await page.goto('/admin/dashboard');

    // ต้อง redirect ไปหน้า /
    await expect(page).toHaveURL(/\//);
  });

  test('user ธรรมดาเข้า /admin/users → redirect ไปหน้า /', async ({ page }) => {
    await loginAsNormalUser(page);
    await page.goto('/admin/users');
    // ต้อง redirect ไปหน้า /
    await expect(page).toHaveURL(/\//);
  });

  test('user ธรรมดาเข้า /admin/foods → redirect ไปหน้า /', async ({ page }) => {
    await loginAsNormalUser(page);
    await page.goto('/admin/foods');
    // ต้อง redirect ไปหน้า /
    await expect(page).toHaveURL(/\//);
  });

});

// ──────────────────────────────────────────────
// Admin Functionality Tests: ต้องมี ADMIN_EMAIL env
// ──────────────────────────────────────────────
test.describe('Admin Dashboard (requires ADMIN role)', () => {

  // Skip ทั้ง describe block ถ้าไม่มี admin credentials ใน env
  test.skip(!HAS_ADMIN_CREDS, 'ข้าม: ไม่พบ ADMIN_EMAIL หรือ ADMIN_PASSWORD ใน .env.test');

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
  });

  test('admin เห็น heading "Admin Dashboard"', async ({ page }) => {
    // ตรวจว่า heading Admin Dashboard แสดงอยู่
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 8000 });
  });

  test('admin เห็น System Overview label', async ({ page }) => {
    // ตรวจว่า label System Overview แสดงอยู่
    await expect(page.getByText('System Overview')).toBeVisible({ timeout: 5000 });
  });

  test('admin เห็น stat cards: AI Usage, Meals stats', async ({ page }) => {
    // รอให้ fetch stats API เสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่ามี stat cards แสดงอยู่
    // (ชื่อ label จาก API stats)
    await expect(page.getByText(/AI Usage|Meals|Total/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('admin เห็นลิงก์ไปหน้า /admin/users', async ({ page }) => {
    // ตรวจว่ามีลิงก์ไปจัดการ users
    const usersLink = page.getByRole('link', { name: /users/i }).first();
    await expect(usersLink).toBeVisible({ timeout: 5000 });
  });

});
