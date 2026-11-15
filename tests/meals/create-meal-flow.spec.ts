import { test, expect } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
  createTestUser,
  cleanupTestUser,
} from '../helpers/db';

/**
 * ============================================================================
 * 🍽️ E2E Flow: Create Meal → Summary Updates
 * ============================================================================
 * ขั้นตอนการทดสอบ:
 * 1. เตรียมผู้ใช้ทดสอบใน Database พร้อม Profile (เพื่อคำนวณ Target แคลอรี/โปรตีน)
 * 2. เข้าสู่ระบบด้วยบัญชีทดสอบ แล้วไปที่หน้า /dashboard
 * 3. ตรวจสอบค่าบริโภคเริ่มต้น (Consumed) ของวันว่าเริ่มต้นที่ 0
 * 4. ไปที่หน้า /meals/new เพื่อบันทึกมื้ออาหาร
 * 5. กรอกประเภทมื้อ (เช่น BREAKFAST) และรายการอาหาร
 *    - ทำการ Mock AI response เพื่อให้ผลลัพธ์คำนวณแคลอรี/โปรตีนแน่นอนและเสถียร ไม่ขึ้นกับ AI ภายนอก
 * 6. กดบันทึก (Save meal) และรอระบบ redirect กลับไปยัง /dashboard
 * 7. ตรวจสอบว่าหน้า Dashboard มีการอัปเดตตัวเลขแคลอรีและโปรตีนตามมื้ออาหารที่บันทึก
 * ============================================================================
 */

test.describe('Meal Flow: Create Meal → Summary Updates', () => {
  const timestamp = Date.now();
  const testEmail = `meal_test_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Meal Flow User';

  // เตรียมผู้ใช้พร้อม Profile ก่อนเริ่มเทส
  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    await createTestUser(testEmail, hashedPassword, testName, true);
  });

  // ล้างข้อมูลหลังจบการทดสอบ
  test.afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  test('เมื่อบันทึกอาหารสำเร็จ ตัวเลข Calories และ Protein บน Dashboard จะต้องอัปเดต', async ({ page }) => {
    // ----------------------------------------------------
    // ขั้นตอนที่ 1: เข้าสู่ระบบ
    // ----------------------------------------------------
    await page.goto('/signin');
    await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(testEmail);
    await page.getByLabel(/Password|รหัสผ่าน/i).fill(testPassword);
    await page.getByRole('button', { name: /Log in|เข้าสู่ระบบ/i }).click();
    await expect(page).toHaveURL('/');

    // ----------------------------------------------------
    // ขั้นตอนที่ 2: ไปหน้า /dashboard และตรวจค่าเริ่มต้น (0 kcal)
    // ----------------------------------------------------
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // ตรวจสอบว่าเริ่มแรก consumed คือ 0
    await expect(page.getByText('0', { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // ----------------------------------------------------
    // ขั้นตอนที่ 3: ไปหน้า /meals/new
    // ----------------------------------------------------
    const addMealLink = page.getByRole('link', { name: /เพิ่มมื้ออาหาร|Add meal/i });
    await expect(addMealLink).toBeVisible();
    await addMealLink.click();
    await expect(page).toHaveURL('/meals/new');

    // ----------------------------------------------------
    // ขั้นตอนที่ 4: กรอกฟอร์มบันทึกอาหาร
    // ----------------------------------------------------
    // เลือกประเภทมื้อเป็น Breakfast
    await page.locator('select').selectOption('BREAKFAST');

    // กรอกรายการอาหาร
    const mealText = 'กล้วยหอม (Banana)';
    await page.locator('#meal-text').fill(mealText);

    // ดักรอ response จาก /api/meals
    const mealResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/meals') && res.request().method() === 'POST'
    );

    // กดปุ่มบันทึกอาหาร
    await page.getByRole('button', { name: /Save meal|บันทึกมื้ออาหาร/i }).click();

    const mealResponse = await mealResponsePromise;
    expect(mealResponse.status()).toBe(200);

    const mealData = await mealResponse.json();
    const addedCalories = mealData.totalCalories
    const addedProtein = mealData.totalProtein

    // ตรวจสอบ Toast สำเร็จ
    const notifications = page.getByRole('region', { name: /notifications/i });
    await expect(notifications).toContainText(/บันทึกมื้ออาหารสำเร็จ|Meal saved successfully/i, { timeout: 10000 });

    // ----------------------------------------------------
    // ขั้นตอนที่ 5: ตรวจสอบหน้า Dashboard หลัง Redirect
    // ----------------------------------------------------
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // ตรวจสอบว่าค่า Calories บนหน้า Dashboard อัปเดตตรงกับมื้อที่เพิ่งบันทึก
    await expect(page.getByTestId('calories-consumed'))
      .toHaveText(String(addedCalories), { timeout: 10000 });

    // ตรวจสอบว่าค่า Protein บนหน้า Dashboard มีการอัปเดต
    await expect(page.getByTestId('protein-consumed'))
      .toHaveText(String(addedProtein), { timeout: 10000 });
  });
});

