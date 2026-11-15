
import { test, expect, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 🍽️ E2E Add New Meal Flow
 * ============================================================================
 * ทดสอบหน้า /meals/new สำหรับการบันทึกมื้ออาหาร
 *
 * Test Cases:
 * 1. หน้า /meals/new โหลดได้และแสดง Heading
 * 2. มี Dropdown เลือกประเภทมื้ออาหารครบ 4 ประเภท
 * 3. มี Tab เปลี่ยน Mode ระหว่าง TEXT และ IMAGE (AI)
 * 4. Mode TEXT แสดง Textarea สำหรับกรอกชื่ออาหาร
 * 5. Mode IMAGE (AI) ซ่อน Textarea และแสดง File Input
 * 6. มีลิงก์ Back to dashboard
 * 7. สามารถเปลี่ยน Meal Type และกรอกข้อมูลอาหารได้
 *
 * Test Data:
 * - สร้าง Mock User จาก Timestamp เพื่อป้องกัน Email ซ้ำ
 * - ไม่ใช้ข้อมูลจาก .env
 * - สร้าง User พร้อม Profile ก่อนเริ่มทดสอบ
 *
 * Cleanup:
 * - ลบ Test User และข้อมูลที่เกี่ยวข้องหลังจบการทดสอบ
 * ============================================================================
 */

// ============================================================================
// Mock Data
// ============================================================================

// สร้าง Timestamp สำหรับกำหนด Email ที่ไม่ซ้ำกันในแต่ละ Test Run
const timestamp = Date.now();

const testEmail = `meals_test_${timestamp}@example.com`;
const testPassword = 'Password123!';
const testName = 'Meals Test User';

// ============================================================================
// Helper: Login และเข้าสู่หน้า Add New Meal
// ============================================================================

async function loginAndGotoNewMeal(page: Page) {

  // ----------------------------------------------------
  // ขั้นตอนที่ 1: เปิดหน้า Sign in
  // ----------------------------------------------------
  await page.goto('/signin');

  // ----------------------------------------------------
  // ขั้นตอนที่ 2: กรอกข้อมูล Mock User
  // ----------------------------------------------------
  await page.locator('#signin-email').fill(testEmail);
  await page.locator('#signin-password').fill(testPassword);

  // ----------------------------------------------------
  // ขั้นตอนที่ 3: กด Login
  // ----------------------------------------------------
  await page.getByRole('button', {
    name: /Log in|เข้าสู่ระบบ/i,
  }).click();

  // ตรวจสอบว่า Login สำเร็จและ Redirect ไปหน้า Home
  await expect(page).toHaveURL('/');

  // ----------------------------------------------------
  // ขั้นตอนที่ 4: เข้าสู่หน้า Add New Meal
  // ----------------------------------------------------
  await page.goto('/meals/new', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  // ตรวจสอบว่าเข้าสู่หน้า Add New Meal สำเร็จ
  await expect(page).toHaveURL('/meals/new');
}

// ============================================================================
// Test Suite: Add New Meal
// ============================================================================

test.describe('Add New Meal', () => {

  // =========================================================================
  // Setup: สร้าง Mock User ก่อนเริ่มทดสอบ
  // =========================================================================

  test.beforeAll(async () => {

    // Hash Password ก่อนบันทึกลง Database
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // สร้าง Test User พร้อม Profile
    await createTestUser(
      testEmail,
      hashedPassword,
      testName,
      true,
    );
  });

  // =========================================================================
  // Setup: Login ก่อนเริ่มแต่ละ Test
  // =========================================================================

  test.beforeEach(async ({ page }) => {

    // Login ด้วย Mock User และเข้าสู่หน้า Add New Meal
    await loginAndGotoNewMeal(page);
  });

  // =========================================================================
  // Test Case 1: ตรวจสอบหน้า Add New Meal
  // =========================================================================

  test('หน้า /meals/new โหลดได้และมี heading', async ({ page }) => {

    // ตรวจสอบ Heading หลักของหน้า Add New Meal
    await expect(
      page.getByRole('heading', {
        name: /Record your meal|บันทึกมื้ออาหาร/i,
      })
    ).toBeVisible({ timeout: 8000 });
  });

  // =========================================================================
  // Test Case 2: ตรวจสอบ Dropdown Meal Type
  // =========================================================================

  test('มี dropdown เลือกประเภทมื้ออาหารครบ 4 ประเภท', async ({ page }) => {

    // ค้นหา Dropdown สำหรับเลือกประเภทมื้ออาหาร
    const select = page.locator('select');

    // ตรวจสอบว่า Dropdown แสดงอยู่
    await expect(select).toBeVisible();

    // ตรวจสอบว่ามีตัวเลือก Breakfast
    await expect(
      select.locator('option[value="BREAKFAST"]')
    ).toHaveCount(1);

    // ตรวจสอบว่ามีตัวเลือก Lunch
    await expect(
      select.locator('option[value="LUNCH"]')
    ).toHaveCount(1);

    // ตรวจสอบว่ามีตัวเลือก Dinner
    await expect(
      select.locator('option[value="DINNER"]')
    ).toHaveCount(1);

    // ตรวจสอบว่ามีตัวเลือก Snack
    await expect(
      select.locator('option[value="SNACK"]')
    ).toHaveCount(1);
  });

  // =========================================================================
  // Test Case 3: ตรวจสอบ Mode Selection
  // =========================================================================

  test('มีปุ่ม tab เปลี่ยน mode: TEXT และ IMAGE (AI)', async ({ page }) => {

    // ตรวจสอบว่ามีปุ่ม TEXT สำหรับกรอกข้อมูลอาหาร
    await expect(
      page.getByRole('button', {
        name: /TEXT|ข้อความ/i,
      })
    ).toBeVisible();

    // ตรวจสอบว่ามีปุ่ม IMAGE (AI) สำหรับวิเคราะห์อาหารจากรูปภาพ
    await expect(
      page.getByRole('button', {
        name: /IMAGE\s*\(AI\)|รูปภาพ\s*\(AI\)/i,
      })
    ).toBeVisible();
  });

  // =========================================================================
  // Test Case 4: ตรวจสอบ Textarea ใน TEXT Mode
  // =========================================================================

  test('mode TEXT: มี textarea กรอกชื่ออาหาร', async ({ page }) => {

    // ค้นหา Textarea สำหรับกรอกข้อมูลอาหาร
    const textarea = page.locator('textarea').first();

    // ตรวจสอบว่า Textarea แสดงอยู่
    await expect(textarea).toBeVisible();

    // ตรวจสอบ Placeholder ว่าตรงตามที่กำหนด
    await expect(textarea).toHaveAttribute(
      'placeholder',
      /Rice 250g|e\.g\.|ไก่|ข้าว/i,
    );
  });

  // =========================================================================
  // Test Case 5: ทดสอบการเปลี่ยน TEXT → IMAGE (AI)
  // =========================================================================

  test('สลับ mode ไปเป็น IMAGE (AI) → textarea ซ่อนและแสดง file input', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: กดปุ่ม IMAGE (AI)
    // ----------------------------------------------------

    await page.getByRole('button', {
      name: /IMAGE\s*\(AI\)|รูปภาพ\s*\(AI\)/i,
    }).click();

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ตรวจสอบว่า Textarea ถูกซ่อน
    // ----------------------------------------------------

    await expect(
      page.locator('textarea').first()
    ).not.toBeVisible();

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: ตรวจสอบ File Input
    // ----------------------------------------------------

    // ตรวจสอบว่ามี File Input อยู่ใน DOM
    await expect(
      page.locator('input[type="file"]')
    ).toBeAttached();
  });

  // =========================================================================
  // Test Case 6: ตรวจสอบ Back to Dashboard
  // =========================================================================

  test('มีลิงก์ Back to dashboard', async ({ page }) => {

    // ค้นหาลิงก์สำหรับกลับไปหน้า Dashboard
    const backLink = page.getByRole('link', {
      name: /Back to dashboard|กลับไปหน้าแดชบอร์ด/i,
    });

    // ตรวจสอบว่าลิงก์แสดงอยู่
    await expect(backLink).toBeVisible();

    // คลิกลิงก์และรอให้ Navigation เสร็จสิ้น
    await Promise.all([
      page.waitForURL('/dashboard'),
      backLink.click(),
    ]);

    // ตรวจสอบ URL หลัง Navigation
    await expect(page).toHaveURL('/dashboard');
  });

  // =========================================================================
  // Test Case 7: ทดสอบการเลือก Meal Type และกรอกข้อมูลอาหาร
  // =========================================================================

  test('เปลี่ยน meal type เป็น Lunch และกรอก meal text', async ({ page }) => {

    // ----------------------------------------------------
    // ขั้นตอนที่ 1: เลือกประเภทมื้ออาหารเป็น Lunch
    // ----------------------------------------------------

    const select = page.locator('select');

    await select.selectOption('LUNCH');

    // ตรวจสอบว่าเลือก Lunch สำเร็จ
    await expect(select).toHaveValue('LUNCH');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: กรอกข้อมูลอาหาร
    // ----------------------------------------------------

    const textarea = page.locator('textarea').first();

    await textarea.fill('Rice 300g, grilled fish 200g');

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: ตรวจสอบข้อมูลที่กรอก
    // ----------------------------------------------------

    await expect(textarea).toHaveValue(
      'Rice 300g, grilled fish 200g',
    );
  });

  // =========================================================================
  // Cleanup: ลบ Mock User หลังจบการทดสอบ
  // =========================================================================

  test.afterAll(async () => {

    // ลบ Test User และข้อมูลที่เกี่ยวข้องออกจาก Database
    await cleanupTestUser(testEmail);
  });

});
