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
  await page.getByPlaceholder(/Email address|ที่อยู่อีเมล/i).fill('test@example.com');
  await page.getByPlaceholder(/Password|รหัสผ่าน/i).fill('password123');
  await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();

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
    // ตรวจว่า heading แสดงอยู่ทั้งภาษาไทยและอังกฤษ
    await expect(page.getByRole('heading', { name: /การวิเคราะห์|Analytics/i })).toBeVisible({ timeout: 8000 });
  });

  test('แสดง subheading PERFORMANCE OVERVIEW', async ({ page }) => {
    // ตรวจว่ามี label ภาพรวมประสิทธิภาพหรือ PERFORMANCE OVERVIEW
    await expect(page.getByText(/ภาพรวมประสิทธิภาพ|PERFORMANCE OVERVIEW/i)).toBeVisible({ timeout: 5000 });
  });

  test('มีปุ่ม time range selector: 7 DAYS และ 30 DAYS', async ({ page }) => {
    // รอให้ page โหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่าปุ่ม time range มีอยู่ทั้งสองปุ่ม โดยรองรับทั้งภาษาไทยและอังกฤษ
    await expect(page.getByRole('button', { name: /7 วัน|7 DAYS/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /30 วัน|30 DAYS/i })).toBeVisible({ timeout: 5000 });
  });

  test('คลิก 30 DAYS → ปุ่มเปลี่ยนสถานะเป็น active', async ({ page }) => {
    // รอให้หน้าโหลด
    await page.waitForLoadState('networkidle');

    // คลิกปุ่ม 30 วัน / 30 DAYS
    const btn30 = page.getByRole('button', { name: /30 วัน|30 days|30 DAYS/i });
    await btn30.click();

    // ใช้ state ที่ UI จริงใช้งาน: aria-pressed
    await expect(btn30).toHaveAttribute('aria-pressed', 'true');
  });

  test('แสดง stat cards: AVG CALORIES, CONSISTENCY SCORE', async ({ page }) => {
    // รอให้ fetch analytics API เสร็จ
    await page.waitForLoadState('networkidle');

    // ตรวจว่ามี stat cards แสดงอยู่ ทั้งภาษาไทยและอังกฤษ
    await expect(page.getByText(/ค่าแคลอรี่เฉลี่ย|AVG CALORIES/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/คะแนนความสม่ำเสมอ|CONSISTENCY SCORE/i)).toBeVisible({ timeout: 8000 });
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
