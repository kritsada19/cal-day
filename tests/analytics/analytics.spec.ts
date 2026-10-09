import { test, expect, type Page } from '@playwright/test';

// ============================================================
// 📊 Analytics
// ทดสอบหน้า /analytics แสดงข้อมูลสถิติการกินอาหาร
// ============================================================

// ──────────────────────────────────────────────
// Helper: ล็อกอินและไปหน้า analytics
// ──────────────────────────────────────────────
async function loginAndGotoAnalytics(page: Page) {
  await page.goto('/signin');
  await page.getByPlaceholder('Enter your email address').fill('test@example.com');
  await page.getByPlaceholder('Enter your password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL('/');

  await page.goto('/analytics', {
    waitUntil: 'domcontentloaded',
  });
}

test.describe('Analytics', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndGotoAnalytics(page);
  });

  test('หน้า analytics โหลดได้และแสดง heading', async ({ page }) => {
    // ตรวจว่า heading "Analytics" แสดงอยู่
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 8000 });
  });

  test('แสดง subheading PERFORMANCE OVERVIEW', async ({ page }) => {
    // ตรวจว่ามี label PERFORMANCE OVERVIEW
    await expect(page.getByText('PERFORMANCE OVERVIEW')).toBeVisible({ timeout: 5000 });
  });

  test('มีปุ่ม time range selector: 7 DAYS และ 30 DAYS', async ({ page }) => {
    // รอให้ page โหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่าปุ่ม time range มีอยู่ทั้งสองปุ่ม
    await expect(page.getByRole('button', { name: '7 DAYS' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '30 DAYS' })).toBeVisible({ timeout: 5000 });
  });

  test('คลิก 30 DAYS → ปุ่มเปลี่ยนสถานะเป็น active', async ({ page }) => {
    // รอให้หน้าโหลด
    await page.waitForLoadState('networkidle');

    // คลิกปุ่ม 30 DAYS
    const btn30 = page.getByRole('button', { name: '30 DAYS' });
    await btn30.click();

    // ปุ่ม 30 DAYS ต้องกลายเป็น active (มีสี gold accent — class bg-gold-accent)
    // ตรวจสอบผ่าน class ที่เปลี่ยนไป
    await expect(btn30).toHaveClass(/bg-gold-accent/);
  });

  test('แสดง stat cards: AVG CALORIES, CONSISTENCY SCORE', async ({ page }) => {
    // รอให้ fetch analytics API เสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่ามี stat cards แสดงอยู่
    await expect(page.getByText('AVG CALORIES')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('CONSISTENCY SCORE')).toBeVisible({ timeout: 8000 });
  });

  test('ผู้ใช้ที่ไม่ได้ login → redirect ไปหน้า signin', async ({ page }) => {
    // clear cookies เพื่อจำลองสถานะ unauthenticated
    await page.context().clearCookies();

    // โหลดหน้า analytics ใหม่โดยไม่ได้ login
    await page.goto('/analytics');

    // analytics page แสดง RESTRICTED ACCESS เมื่อ unauthenticated
    await expect(page).toHaveURL(/\/signin/);
  });

});
