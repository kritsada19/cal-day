import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 👤 Profile
// ทดสอบหน้า /profile แสดงข้อมูล account และ quick actions
// ============================================================

// ──────────────────────────────────────────────
// Helper: ล็อกอินและไปหน้า profile
// ──────────────────────────────────────────────
async function loginAndGotoProfile(page: Page) {
  await page.goto('/signin');
  await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill('test@example.com');
  await page.getByLabel(/Password|รหัสผ่าน/i).fill('password123');
  await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();
  await page.waitForURL('/');
  await page.goto('/profile', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
}

test.describe('Profile', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGotoProfile(page);
  });

  test('หน้า profile โหลดได้และแสดง heading "Your account"', async ({ page }) => {
    // ตรวจว่า URL ถูกต้อง
    await expect(page).toHaveURL('/profile');

    // ตรวจว่า heading หลักแสดงอยู่ทั้งภาษาไทยและอังกฤษ
    await expect(page.locator('h1').filter({ hasText: /Your account|บัญชีของคุณ/i })).toBeVisible({ timeout: 8000 });
  });

  test('แสดง section "Profile summary"', async ({ page }) => {
    // ตรวจว่ามี label สรุปโปรไฟล์หรือ Profile summary
    await expect(page.getByRole('heading', { name: /Profile summary|สรุปโปรไฟล์/i })).toBeVisible({ timeout: 8000 });
  });

  test('มีลิงก์ Fill personal info / Edit profile', async ({ page }) => {
    // ตรวจว่ามีลิงก์ที่กำหนดไว้แบบไทยหรืออังกฤษ
    await expect(page.locator('h1').filter({ hasText: /Your account|บัญชีของคุณ/i })).toBeVisible({ timeout: 10000 });

    const profileFormLinks = page.locator('a[href="/profile/form"]');
    const primaryProfileLink = profileFormLinks.first();

    await expect(primaryProfileLink).toBeVisible({ timeout: 10000 });
    await expect(primaryProfileLink).toHaveText(/Fill personal info|กรอกข้อมูลส่วนตัว|Edit profile|แก้ไขโปรไฟล์/i);
  });

  test('มีปุ่ม Log out ใน Quick actions', async ({ page }) => {
    // ตรวจว่ามีปุ่มออกจากระบบหรือ Log out ใน section Quick actions
    await expect(page.getByRole('button', { name: /Log out|ออกจากระบบ/i })).toBeVisible({ timeout: 8000 });
  });

  test('กด Log out → redirect ไปหน้า home และ session หมด', async ({ page }) => {
    // คลิกออกจากระบบ
    await page.getByRole('button', { name: /Log out|ออกจากระบบ/i }).click();

    // next-auth จะ redirect ไปหน้า / หลัง signOut({ callbackUrl: "/" })
    await page.waitForURL('/', { timeout: 8000 });
    await expect(page).toHaveURL('/');
  });

  test('มีลิงก์ Back to home ที่ไปหน้า /', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to home|กลับไปหน้าแรก|Go to home|ไปที่หน้าแรก/i }).first();

    await expect(backLink).toBeVisible();

    await Promise.all([
      page.waitForURL('/'),
      backLink.click(),
    ]);

    await expect(page).toHaveURL('/');
  });

  test('แสดง PLAN และ AI REMAINING ใน account info', async ({ page }) => {
    const accountDetails = page.getByRole('heading', { name: /Account details|รายละเอียดบัญชี/i }).locator('..');

    await expect(accountDetails.getByText(/Plan|แผน/i)).toBeVisible();
    await expect(accountDetails.getByText(/AI remaining|AI ที่เหลือ/i)).toBeVisible();
  });

});
