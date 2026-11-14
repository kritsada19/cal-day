import { test, expect } from '@playwright/test';
import bcrypt from 'bcryptjs';
import {
    createTestUser,
    cleanupTestUser,
    upgradeUserToPro,
    getUserPlan,
} from '../helpers/db';

/**
 * ============================================================================
 * 💳 E2E Subscription Flow: Login → FREE → Stripe Checkout → PRO
 * ============================================================================
 * ทดสอบ Lifecycle ของระบบ Subscription ตั้งแต่ผู้ใช้เข้าสู่ระบบจนถึงการอัปเกรดเป็น PRO:
 *
 * 1. สร้าง Test User พร้อม Profile และ Subscription เริ่มต้นเป็น FREE
 * 2. เข้าสู่ระบบผ่านหน้า /signin
 * 3. เข้าหน้า /subscription และตรวจสอบว่า Plan ปัจจุบันเป็น FREE
 * 4. กดปุ่ม Upgrade to Pro และตรวจสอบว่า Redirect ไปยัง Stripe Checkout
 * 5. จำลองการสมัคร Subscription สำเร็จโดยอัปเดต Plan ใน Database เป็น PRO
 *    - ไม่ได้ชำระเงินจริง
 *    - ไม่ได้ทดสอบ Stripe Webhook
 * 6. ตรวจสอบว่า Plan ใน Database เปลี่ยนจาก FREE เป็น PRO
 * 7. ตรวจสอบหน้า /profile ว่าแสดง Plan เป็น PRO
 * 8. ตรวจสอบหน้า /subscription ว่าสถานะเป็น Active
 *    และแสดงปุ่ม Manage Subscription
 *
 * Cleanup:
 * - ลบข้อมูล Test User และข้อมูลที่เกี่ยวข้องหลังจบการทดสอบ
 * ============================================================================
 */

test.describe('Subscription-Flow', () => {
    const timestamp = Date.now();
    const testEmail = `subscription_test_${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Subscription Flow User';

    // เตรียมผู้ใช้พร้อม Profile ก่อนเริ่มเทส
    test.beforeAll(async () => {
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await createTestUser(testEmail, hashedPassword, testName, true);
    });

    // ล้างข้อมูลหลังจบการทดสอบ
    test.afterAll(async () => {
        await cleanupTestUser(testEmail);
    });

    test('เมื่อสมัคร Subscription สำเร็จ plan ต้องเป็น PRO', async ({ page }) => {

        // ----------------------------------------------------
        // ขั้นตอนที่ 1: เข้าสู่ระบบ
        // ----------------------------------------------------
        await page.goto('/signin');

        await page.getByLabel(/Email address|ที่อยู่อีเมล/i).fill(testEmail);
        await page.getByLabel(/Password|รหัสผ่าน/i).fill(testPassword);

        await page.getByRole('button', {
            name: /Log in|เข้าสู่ระบบ/i,
        }).click();

        await expect(page).toHaveURL('/');

        // ----------------------------------------------------
        // ขั้นตอนที่ 2: ตรวจสอบ Plan เป็น FREE
        // ----------------------------------------------------
        await page.goto('/subscription');

        const upgradeButton = page.getByRole('button', {
            name: /Upgrade to Pro|อัปเกรดเป็น Pro/i,
        });

        await expect(upgradeButton).toBeVisible();
        await expect(upgradeButton).toBeEnabled();

        await expect.poll(
            () => getUserPlan(testEmail)
        ).toBe('FREE');

        // ----------------------------------------------------
        // ขั้นตอนที่ 3: Redirect ไป Stripe Checkout
        // ----------------------------------------------------
        await upgradeButton.click();

        await expect(page).toHaveURL(/checkout\.stripe\.com/);

        // ----------------------------------------------------
        // ขั้นตอนที่ 4: จำลองการสมัครสำเร็จ
        // ----------------------------------------------------
        // หมายเหตุ:
        // ขั้นตอนนี้เป็นการจำลอง ไม่ได้ชำระเงินจริง
        // และไม่ได้ทดสอบ Stripe Webhook

        // ----------------------------------------------------
        // ขั้นตอนที่ 5: จำลองการอัปเดต Subscription
        // ----------------------------------------------------
        await upgradeUserToPro(testEmail);

        await expect.poll(
            () => getUserPlan(testEmail)
        ).toBe('PRO');

        // ----------------------------------------------------
        // ขั้นตอนที่ 6: ตรวจสอบหน้า Profile
        // ----------------------------------------------------
        await page.goto('/profile');

        await expect(
            page.getByTestId('profile-plan')
        ).toHaveText(/PRO แผน|PRO Plan/i);

        // ----------------------------------------------------
        // ขั้นตอนที่ 7: ตรวจสอบหน้า Subscription
        // ----------------------------------------------------
        await page.goto('/subscription');

        await expect(
            page.getByText(/Active|ใช้งานอยู่/i)
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: /Manage Subscription|จัดการการสมัคร/i,
            })
        ).toBeVisible();
    });
});