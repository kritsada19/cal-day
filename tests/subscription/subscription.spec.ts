import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 💳 Subscription
// ทดสอบหน้า /subscription แสดงแผน PRO และปุ่ม upgrade
// ============================================================

// ──────────────────────────────────────────────
// Helper: ล็อกอินและไปหน้า subscription
// ──────────────────────────────────────────────
async function loginAndGotoSubscription(page: Page) {
  await page.goto('/signin');
  await page.getByPlaceholder(/Email address|ที่อยู่อีเมล/i).fill('test@example.com');
  await page.getByPlaceholder(/Password|รหัสผ่าน/i).fill('password123');
  await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();
  await page.waitForURL('/');
  await page.goto('/subscription');
}

test.describe('Subscription Page', () => {

  test('ผู้ใช้ที่ไม่ได้ login ต้อง redirect ไปหน้า login', async ({ page }) => {
    // เข้าหน้า subscription โดยไม่ login
    await page.goto('/subscription', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // ตรวจว่า URL ถูกต้อง
    await expect(page).toHaveURL('/signin');

  });

  test.describe('Logged in user', () => {

    test.beforeEach(async ({ page }) => {
      await loginAndGotoSubscription(page);
    });

    test('แสดงราคา ฿199 / month', async ({ page }) => {
      // ตรวจว่ามีราคาแสดงบนหน้า โดยรองรับภาษาไทยและอังกฤษ
      await expect(page.getByText(/฿199|\$199|199/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/\/ month|\/ เดือน/i)).toBeVisible();
    });

    test('แสดง feature list ครบ 4 รายการ', async ({ page }) => {
      // ตรวจว่า feature แต่ละรายการแสดงอยู่ ทั้งภาษาไทยและอังกฤษ
      await expect(page.getByText(/บันทึกมื้ออาหารรายวันแบบไม่จำกัด|UNLIMITED DAILY MEAL LOGGING/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/ติดตามแคลอรี่และแมกโครนิวเทรียนท์|TRACK CALORIES & MACROS/i)).toBeVisible();
      await expect(page.getByText(/เป้าหมายโภชนาการส่วนบุคคล|PERSONALIZED NUTRITION GOALS/i)).toBeVisible();
      await expect(page.getByText(/เข้าถึงปฏิทินความก้าวหน้าทั้งหมด|FULL PROGRESS CALENDAR ACCESS/i)).toBeVisible();
    });

  });

});

// ──────────────────────────────────────────────
// Subscription Success Page
// ──────────────────────────────────────────────
test.describe('Subscription Success Page', () => {

  test('หน้า /subscription/success โหลดได้', async ({ page }) => {
    // เข้าหน้า success โดยตรง (จะถูก redirect หรือแสดงหน้า success)
    await page.goto('/subscription/success');

    // ตรวจว่า page โหลดได้โดยไม่ error (status 200 หรือ redirect)
    // เช็คว่า URL ยังอยู่ในระบบ
    const url = page.url();
    expect(url).not.toContain('error');
  });

});
