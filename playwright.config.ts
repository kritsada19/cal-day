import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // เรียกปิดการเชื่อมต่อฐานข้อมูลหลังจาก test ทั้งหมดเสร็จ
  globalTeardown: './tests/global-teardown.ts',

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,

      // Auth.js
      AUTH_POST_RATE_LIMIT: "1000",
      AUTH_GET_RATE_LIMIT: "2000",

      // Authentication
      SIGN_UP_RATE_LIMIT: "100",

      // Password management
      FORGOT_PASSWORD_RATE_LIMIT: "100",
      RESET_PASSWORD_RATE_LIMIT: "100",
      VERIFY_EMAIL_RATE_LIMIT: "100",

      // Webhooks
      WEBHOOK_UNSIGNED_RATE_LIMIT: "100",
      WEBHOOK_RATE_LIMIT: "1000",

      // Admin
      ADMIN_USERS_RATE_LIMIT: "500",
      ADMIN_USER_DETAIL_RATE_LIMIT: "500",
      ADMIN_USER_DELETE_RATE_LIMIT: "100",
      ADMIN_FOODS_RATE_LIMIT: "500",
      ADMIN_DASHBOARD_RATE_LIMIT: "500",

      // Application
      PROFILE_RATE_LIMIT: "500",
      MEALS_RATE_LIMIT: "1000",
      MEALS_IMAGE_RATE_LIMIT: "100",
      ANALYTICS_RATE_LIMIT: "500",
      CHECKOUT_RATE_LIMIT: "200",
    },
  },
});
