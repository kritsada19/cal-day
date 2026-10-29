import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 🍽️ Meals — Add New Meal
// ทดสอบหน้า /meals/new สำหรับการบันทึกมื้ออาหาร
// ============================================================

// ──────────────────────────────────────────────
// Helper: ล็อกอินแล้วไปหน้า meals/new
// ──────────────────────────────────────────────
async function loginAndGotoNewMeal(page: Page) {
  await page.goto('/signin');
  await page.locator('#signin-email').fill('test@example.com');
  await page.locator('#signin-password').fill('password123');
  await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();
  await page.waitForURL('/');
  await page.goto('/meals/new');
}

test.describe('Add New Meal', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGotoNewMeal(page);
  });

  test('หน้า /meals/new โหลดได้และมี heading', async ({ page }) => {
    // ตรวจว่า heading "Record your meal" แสดงอยู่
    await expect(page.getByRole('heading', { name: /Record your meal|บันทึกมื้ออาหาร/i })).toBeVisible({ timeout: 5000 });
  });

  test('มี dropdown เลือกประเภทมื้ออาหารครบ 4 ประเภท', async ({ page }) => {
    // ตรวจว่า select มีอยู่บนหน้า
    const select = page.locator('select');
    await expect(select).toBeVisible();

    // ตรวจว่ามี option ครบ 4 ประเภท: Breakfast, Lunch, Dinner, Snack
    await expect(select.locator('option[value="BREAKFAST"]')).toHaveCount(1);
    await expect(select.locator('option[value="LUNCH"]')).toHaveCount(1);
    await expect(select.locator('option[value="DINNER"]')).toHaveCount(1);
    await expect(select.locator('option[value="SNACK"]')).toHaveCount(1);
  });

  test('มีปุ่ม tab เปลี่ยน mode: TEXT และ IMAGE (AI)', async ({ page }) => {
    // ตรวจว่าปุ่มสลับ mode มีอยู่
    await expect(page.getByRole('button', { name: /TEXT|ข้อความ/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /IMAGE \(AI\)|รูปภาพ \(AI\)/i })).toBeVisible();
  });

  test('mode TEXT: มี textarea กรอกชื่ออาหาร', async ({ page }) => {
    // ตรวจว่า textarea มีอยู่พร้อม placeholder ที่ถูกต้อง
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', /Rice 250g|e\.g\.|ไก่|ข้าว/i);
  });

  test('สลับ mode ไปเป็น IMAGE (AI) → textarea ซ่อนและแสดง file input', async ({ page }) => {
    // คลิกปุ่ม IMAGE (AI) เพื่อสลับ mode
    await page.getByRole('button', { name: /IMAGE \(AI\)|รูปภาพ \(AI\)/i }).click();

    // textarea ต้องซ่อนไไป
    await expect(page.locator('textarea').first()).not.toBeVisible();

    // ต้องมี input file แสดงขึ้นมาแทน
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('มีลิงก์ Back to dashboard', async ({ page }) => {
    // ตรวจว่ามีลิงก์กลับไปหน้า dashboard
    const backLink = page.getByRole('link', { name: /Back to dashboard|กลับไปหน้าแดชบอร์ด/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('เปลี่ยน meal type เป็น Lunch และกรอก meal text', async ({ page }) => {
    // เปลี่ยน meal type
    await page.locator('select').selectOption('LUNCH');
    await expect(page.locator('select')).toHaveValue('LUNCH');

    // กรอกอาหาร
    const textarea = page.locator('textarea').first();
    await textarea.fill('Rice 300g, grilled fish 200g');

    // ตรวจว่า textarea มีค่าที่กรอกไป
    await expect(textarea).toHaveValue('Rice 300g, grilled fish 200g');
  });

});
