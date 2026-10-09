import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 🔒 Auth — Route Guard & Logout
// ทดสอบว่าหน้าที่ต้อง login ป้องกันผู้ใช้ที่ยังไม่ได้ login
// และทดสอบ logout flow
// ============================================================

// ──────────────────────────────────────────────
// Helper: ล็อกอินด้วย credentials ผ่าน UI
// ใช้ซ้ำได้ใน test อื่น ๆ ที่ต้องการ authenticated state
// ──────────────────────────────────────────────
async function loginAsTestUser(page: Page) {
  await page.goto('/signin');
  await page.getByPlaceholder('Enter your email address').fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  // รอให้ redirect สำเร็จก่อนดำเนินการต่อ
  await page.waitForURL('/');
}

// ──────────────────────────────────────────────
// Protected Routes Guard
// ──────────────────────────────────────────────
test.describe('Protected Route Guard', () => {

  test('เข้าหน้า /dashboard โดยไม่ login → ต้องไม่เห็นข้อมูล dashboard', async ({ page }) => {
    // เข้าหน้า /dashboard โดยตรงโดยไม่ได้ล็อกอิน
    await page.goto('/dashboard');

    // หน้า dashboard ใช้ useSession → ถ้า unauthenticated จะ render ใน loading state
    // หรือ middleware อาจ redirect ไป /signin
    // ไม่ว่าจะเป็นแบบใด ต้องไม่เห็นข้อมูลส่วนตัวของ user
    const url = page.url();
    const isRedirected = url.includes('/signin');
    const hasNutritionText = await page.getByText('Your nutrition overview').isVisible().catch(() => false);

    // ต้องเป็นอย่างใดอย่างหนึ่ง: redirect หรือไม่แสดงเนื้อหาส่วนตัว
    expect(isRedirected || !hasNutritionText).toBeTruthy();
  });

  test('เข้าหน้า /meals/new โดยไม่ login → redirect หน้า signin', async ({ page }) => {
    // meals/new render ข้อความ "Please sign in first" ถ้า unauthenticated
    await page.goto('/meals/new');

    // รอให้ page โหลด session (next-auth จะเช็ค session ก่อน render content)
    await expect(page).toHaveURL(/\/signin/);
  });

});

// ──────────────────────────────────────────────
// Logout Flow
// ──────────────────────────────────────────────
test.describe('Logout', () => {

  test('logout แล้ว session หมด → redirect หน้า signin', async ({ page }) => {
    // ขั้นที่ 1: login ก่อน
    await loginAsTestUser(page);

    // ขั้นที่ 2: ตรวจว่า dashboard โหลดได้หลัง login
    await page.goto('/dashboard');
    await expect(page.getByText('Your nutrition overview')).toBeVisible({ timeout: 5000 });

    // ขั้นที่ 3: logout โดยการ clear cookies (จำลอง signOut)
    await page.context().clearCookies();

    // ขั้นที่ 4: เข้า /meals/new อีกครั้ง → redirect หน้า signin
    await page.goto('/meals/new');
    await expect(page).toHaveURL(/\/signin/);
  });

});
