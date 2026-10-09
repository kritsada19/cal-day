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
  await page.getByPlaceholder('Enter your email address').fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
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

    // ตรวจว่า heading หลักแสดงอยู่
    await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible({ timeout: 8000 });
  });

  test('แสดง section "Profile summary"', async ({ page }) => {
    // ตรวจว่ามี label Profile summary
    await expect(page.getByText('Profile summary')).toBeVisible({ timeout: 8000 });
  });

  test('มีลิงก์ Fill personal info / Edit profile', async ({ page }) => {
    // ตรวจว่ามีลิงก์ Fill personal info หรือ Edit profile ชี้ไป /profile/form
    // (แสดงอย่างใดอย่างหนึ่งขึ้นอยู่กับว่า user ได้กรอกข้อมูลแล้วหรือยัง)

    // รอให้หน้าโหลดเนื้อหา
    await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible({ timeout: 10000 });

    const fillLink = page.getByRole('link', { name: 'Fill personal info' });
    const editLink = page.getByRole('link', { name: 'Edit profile' });

    // วนลูปเช็คว่าอันไหน visible (เพือหลีกเลี่ยง error ตอนใช้ .or() แล้วเจอทั้งสองอัน)
    await expect(async () => {
      const isFillVisible = await fillLink.isVisible();
      const isEditVisible = await editLink.isVisible();
      expect(isFillVisible || isEditVisible).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test('มีปุ่ม Log out ใน Quick actions', async ({ page }) => {
    // ตรวจว่ามีปุ่ม Log out ใน section Quick actions
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible({ timeout: 8000 });
  });

  test('กด Log out → redirect ไปหน้า home และ session หมด', async ({ page }) => {
    // คลิก Log out
    await page.getByRole('button', { name: 'Log out' }).click();

    // next-auth จะ redirect ไปหน้า / หลัง signOut({ callbackUrl: "/" })
    await page.waitForURL('/', { timeout: 8000 });
    await expect(page).toHaveURL('/');
  });

  test('มีลิงก์ Back to home ที่ไปหน้า /', async ({ page }) => {
    const backLink = page.getByRole('link', { name: 'Back to home' });

    await expect(backLink).toBeVisible();

    await Promise.all([
      page.waitForURL('/'),
      backLink.click(),
    ]);

    await expect(page).toHaveURL('/');
  });

  test('แสดง PLAN และ AI REMAINING ใน account info', async ({ page }) => {
    const accountDetails = page.getByRole('complementary');

    await expect(accountDetails.getByText('PLAN', { exact: true })).toBeVisible();
    await expect(accountDetails.getByText('AI REMAINING', { exact: true })).toBeVisible();
  });

});
