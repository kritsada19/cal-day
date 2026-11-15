
import { test, expect, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import {
    createTestUser,
    setUserRole,
    getUserRole,
    cleanupTestUser,
} from "../helpers/db";

/**
 * ============================================================================
 * 🛡️ E2E Admin Authorization & Privilege Protection
 * ============================================================================
 *
 * วัตถุประสงค์:
 * 1. ป้องกันผู้ที่ไม่ได้ Login เข้าถึง Admin
 * 2. ป้องกัน USER เข้าถึงหน้า Admin
 * 3. ป้องกัน USER เรียก Admin API โดยตรง
 * 4. ป้องกัน Privilege Escalation
 * 5. ตรวจสอบว่า ADMIN สามารถใช้งานระบบได้
 *
 * ขั้นตอนการเตรียมข้อมูล:
 * 1. สร้าง Normal User ด้วย Timestamp
 * 2. สร้าง Admin User ด้วย Timestamp
 * 3. กำหนด Role ของ Admin เป็น ADMIN ผ่าน Database
 * 4. ตรวจสอบ Role ของบัญชีทั้งสองจาก Database
 * 5. เริ่มทดสอบ Authentication และ Authorization
 * 6. ล้างข้อมูลบัญชีทดสอบหลังจบการทดสอบ
 *
 * หมายเหตุ:
 * - ใช้ pg helper แทน Prisma Client
 * - ใช้ bcryptjs Hash Password
 * - ไม่ต้องพึ่งบัญชีจาก .env.test
 * - บัญชีทดสอบถูกสร้างใหม่ทุกครั้ง
 * ============================================================================
 */

// ============================================================
// 1. TEST CONFIGURATION
// ============================================================

// ป้องกันการรัน Test พร้อมกันในไฟล์นี้
// เนื่องจากทุก Test ใช้บัญชีทดสอบชุดเดียวกัน
test.describe.configure({ mode: "serial" });

const timestamp = Date.now();

const NORMAL_EMAIL = `user_test_${timestamp}@example.com`;
const ADMIN_EMAIL = `admin_test_${timestamp}@example.com`;

const TEST_PASSWORD = "Password123!";

const NORMAL_NAME = "Normal Test User";
const ADMIN_NAME = "Admin Test User";

// ============================================================
// 2. TEST ENDPOINTS
// ============================================================

// ⚠️ ตรวจสอบชื่อ API ให้ตรงกับ app/api/admin ใน CalDay
const ADMIN_API_ENDPOINTS = [
    "/api/admin/dashboard/aiUsage",
    "/api/admin/dashboard/meals",
    "/api/admin/users",
    "/api/admin/foods",
];

// ============================================================
// 3. TEST SETUP & CLEANUP
// ============================================================

/**
 * เตรียมบัญชี USER และ ADMIN ก่อนเริ่มทดสอบ
 */
test.beforeAll(async () => {
    // ----------------------------------------------------------
    // ขั้นตอนที่ 1: Hash Password
    // ----------------------------------------------------------

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    try {
        // --------------------------------------------------------
        // ขั้นตอนที่ 2: สร้าง Normal User
        // --------------------------------------------------------

        await createTestUser(
            NORMAL_EMAIL,
            hashedPassword,
            NORMAL_NAME,
            true
        );

        // --------------------------------------------------------
        // ขั้นตอนที่ 3: สร้าง Admin User
        // --------------------------------------------------------

        await createTestUser(
            ADMIN_EMAIL,
            hashedPassword,
            ADMIN_NAME,
            true
        );

        // --------------------------------------------------------
        // ขั้นตอนที่ 4: กำหนด Role ของ Admin
        // --------------------------------------------------------

        await setUserRole(ADMIN_EMAIL, "ADMIN");

        // --------------------------------------------------------
        // ขั้นตอนที่ 5: ตรวจสอบ Role จาก Database
        // --------------------------------------------------------

        const normalRole = await getUserRole(NORMAL_EMAIL);
        const adminRole = await getUserRole(ADMIN_EMAIL);

        expect(normalRole).toBe("USER");
        expect(adminRole).toBe("ADMIN");

    } catch (error) {
        // หากเตรียมบัญชีไม่สำเร็จ ให้ล้างข้อมูลที่สร้างไปแล้ว
        await cleanupTestUser(NORMAL_EMAIL);
        await cleanupTestUser(ADMIN_EMAIL);

        throw error;
    }
});

/**
 * ล้างบัญชีทดสอบหลังการทดสอบทั้งหมดเสร็จสิ้น
 */
test.afterAll(async () => {
    await cleanupTestUser(NORMAL_EMAIL);
    await cleanupTestUser(ADMIN_EMAIL);
});

// ============================================================
// 4. HELPER FUNCTIONS
// ============================================================

/**
 * Login ด้วยบัญชี USER
 */
async function loginAsNormalUser(page: Page) {
    await page.goto("/signin");

    await page.locator("#signin-email").fill(NORMAL_EMAIL);
    await page.locator("#signin-password").fill(TEST_PASSWORD);

    await page
        .getByRole("button", {
            name: /Log in|เข้าสู่ระบบ/i,
        })
        .click();

    await page.waitForURL("/");
}

/**
 * Login ด้วยบัญชี ADMIN
 */
async function loginAsAdmin(page: Page) {
    await page.goto("/signin");

    await page.locator("#signin-email").fill(ADMIN_EMAIL);
    await page.locator("#signin-password").fill(TEST_PASSWORD);

    await page
        .getByRole("button", {
            name: /Log in|เข้าสู่ระบบ/i,
        })
        .click();

    await page.waitForURL("/");
}

// ============================================================
// 5. AUTHENTICATION TESTS
// ============================================================

test.describe("Admin Authentication Guard", () => {

    test("Unauthenticated user cannot access Admin Dashboard", async ({
        page,
    }) => {
        // ผู้ใช้ที่ไม่ได้ Login พยายามเข้าหน้า Admin
        await page.goto("/admin/dashboard");

        // ต้องถูก Redirect ไปหน้า Sign in
        await expect(page).toHaveURL(/\/signin/);

        // ตรวจสอบว่า Form Login แสดงอยู่
        await expect(
            page.locator("#signin-email")
        ).toBeVisible();
    });

    test("Unauthenticated user cannot access Admin Users", async ({
        page,
    }) => {
        // พยายามเข้าหน้าจัดการผู้ใช้โดยไม่มี Session
        await page.goto("/admin/users");

        await expect(page).toHaveURL(/\/signin/);
    });

    test("Unauthenticated user cannot access Admin Foods", async ({
        page,
    }) => {
        // พยายามเข้าหน้าจัดการอาหารโดยไม่มี Session
        await page.goto("/admin/foods");

        await expect(page).toHaveURL(/\/signin/);
    });

});

// ============================================================
// 6. NORMAL USER PAGE GUARD TESTS
// ============================================================

test.describe("Admin Page Authorization", () => {

    test.beforeEach(async ({ page }) => {
        // ทุก Test ในกลุ่มนี้ Login เป็น USER ก่อน
        await loginAsNormalUser(page);
    });

    test("USER cannot access Admin Dashboard", async ({ page }) => {
        await page.goto("/admin/dashboard");

        // USER ต้องถูกปฏิเสธสิทธิ์และ Redirect กลับหน้าแรก
        await expect(page).toHaveURL("/");
    });

    test("USER cannot access Admin Users", async ({ page }) => {
        await page.goto("/admin/users");

        await expect(page).toHaveURL("/");
    });

    test("USER cannot access Admin Foods", async ({ page }) => {
        await page.goto("/admin/foods");

        await expect(page).toHaveURL("/");
    });

    test("USER cannot access Admin page by direct URL", async ({
        page,
    }) => {
        // ทดสอบการเข้าถึง URL โดยตรง
        // ไม่ได้ผ่าน Navigation หรือปุ่มใน UI

        await page.goto("/admin/dashboard");

        await expect(page).not.toHaveURL(/\/admin\//);
    });

});

// ============================================================
// 7. ADMIN API AUTHORIZATION TESTS
// ============================================================

test.describe("Admin API Authorization", () => {

    // ----------------------------------------------------------
    // Unauthenticated
    // ผู้ใช้ที่ไม่ได้ Login ต้องไม่สามารถเรียก Admin API ได้
    // ----------------------------------------------------------

    test("Unauthenticated user cannot access Admin APIs", async ({
        request,
    }) => {

        for (const endpoint of ADMIN_API_ENDPOINTS) {
            const response = await request.get(endpoint);

            // API ต้องมีอยู่จริง ไม่ใช่ 404
            expect(
                response.status(),
                `Endpoint not found: ${endpoint}`
            ).not.toBe(404);

            // ไม่มี Session ต้องถูกปฏิเสธ
            expect(
                response.status(),
                `Unauthenticated access: ${endpoint}`
            ).toBe(401);
        }
    });

    // ----------------------------------------------------------
    // Normal User
    // ผู้ใช้ทั่วไป Login แล้ว แต่ไม่มี ADMIN role
    // ต้องไม่สามารถเรียก Admin API ได้
    // ----------------------------------------------------------

    test("Normal USER cannot access Admin APIs", async ({ page }) => {

        await loginAsNormalUser(page);

        for (const endpoint of ADMIN_API_ENDPOINTS) {
            // ใช้ Session Cookie จาก Browser
            const response = await page.request.get(endpoint);

            expect(
                response.status(),
                `Normal USER access: ${endpoint}`
            ).not.toBe(404);

            // Login แล้วแต่ไม่มีสิทธิ์ ADMIN
            expect(
                response.status(),
                `USER should not access: ${endpoint}`
            ).toBe(403);
        }
    });

    // ----------------------------------------------------------
    // Admin
    // ADMIN ต้องสามารถเรียก Dashboard API ได้
    // ----------------------------------------------------------

    test("ADMIN can access Admin Dashboard APIs", async ({ page }) => {

        await loginAsAdmin(page);

        for (const endpoint of ADMIN_API_ENDPOINTS) {
            const response = await page.request.get(endpoint);

            // ADMIN ต้องได้รับอนุญาต
            expect(
                response.status(),
                `ADMIN access: ${endpoint}`
            ).toBe(200);

            // ตรวจสอบว่า Response เป็น JSON
            const data = await response.json();

            expect(data).toBeTruthy();
        }
    });

});

// ============================================================
// 8. ADMIN NAVIGATION VISIBILITY TESTS
// ============================================================

test.describe("Admin Navigation Visibility", () => {

    test("Normal USER should not see Admin navigation", async ({
        page,
    }) => {

        await loginAsNormalUser(page);

        // USER ไม่ควรเห็น Navigation สำหรับ Admin
        await expect(
            page.getByRole("link", {
                name: /admin|ผู้ดูแลระบบ/i,
            })
        ).toHaveCount(0);
    });

    test("ADMIN should see Admin navigation", async ({ page }) => {

        await loginAsAdmin(page);

        await expect(
            page.getByRole("link", {
                name: /admin|ผู้ดูแลระบบ/i,
            })
        ).toBeVisible();
    });

});

// ============================================================
// 9. PRIVILEGE ESCALATION TESTS
// ============================================================

test.describe("Privilege Escalation Protection", () => {

    test("USER cannot modify their role through profile update", async ({
        page,
    }) => {

        await loginAsNormalUser(page);

        // พยายามส่ง Role = ADMIN ผ่าน Profile API
        const response = await page.request.post("/api/profile", {
            data: {
                gender: "MALE",
                age: 20,
                weight: 70,
                height: 180,
                exerciseLevel: "LIGHT",
                goal: "MAINTAIN_WEIGHT",
                role: "ADMIN",
            },
        });

        // Profile API ต้องทำงานได้ตามปกติ
        expect(response.status()).toBe(200);

        // ตรวจสอบ Role จริงจาก Database
        const role = await getUserRole(NORMAL_EMAIL);

        // Role ต้องไม่เปลี่ยนเป็น ADMIN
        expect(role).toBe("USER");
    });

});

// ============================================================
// 10. ADMIN DASHBOARD FUNCTIONALITY TESTS
// ============================================================

test.describe("Admin Dashboard Functionality", () => {

    test.beforeEach(async ({ page }) => {
        // Login ด้วยบัญชี ADMIN
        await loginAsAdmin(page);

        // เข้าสู่หน้า Dashboard
        await page.goto("/admin/dashboard");
    });

    test("ADMIN can access Admin Dashboard", async ({ page }) => {

        await expect(page).toHaveURL(/\/admin\/dashboard/);

        await expect(
            page.getByRole("heading", {
                name: /Admin Dashboard|แดชบอร์ดผู้ดูแล/i,
            })
        ).toBeVisible({ timeout: 8000 });
    });

    test("ADMIN can see System Overview", async ({ page }) => {

        await expect(
            page.getByText(/System Overview|ภาพรวมระบบ/i)
        ).toBeVisible({ timeout: 5000 });
    });

    test("ADMIN can see AI Usage and Meals statistics", async ({
        page,
    }) => {

        // รอให้ API ที่โหลดข้อมูล Dashboard ทำงานเสร็จ
        await page.waitForLoadState("networkidle");

        await expect(
            page.getByText(
                /AI Usage|Meals|Total|การใช้ AI|มื้ออาหาร|ทั้งหมด/i
            ).first()
        ).toBeVisible({ timeout: 8000 });
    });

    test("ADMIN can see Users navigation", async ({ page }) => {

        await expect(
            page.getByRole("link", {
                name: /users|ผู้ใช้/i,
            }).first()
        ).toBeVisible();
    });

});

// ============================================================
// 11. ADMIN PAGE ACCESS TESTS
// ============================================================

test.describe("Admin Management Pages", () => {

    test.beforeEach(async ({ page }) => {
        // Login ด้วยบัญชี ADMIN
        await loginAsAdmin(page);
    });

    test("ADMIN can access Users page", async ({ page }) => {

        await page.goto("/admin/users");

        await expect(page).toHaveURL(/\/admin\/users/);
    });

    test("ADMIN can access Foods page", async ({ page }) => {

        await page.goto("/admin/foods");

        await expect(page).toHaveURL(/\/admin\/foods/);
    });

});
