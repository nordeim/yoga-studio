import { defineConfig, devices } from '@playwright/test';

/**
 * IRONFORGE — Playwright E2E config.
 *
 * Chromium only (cross-browser visual QA is manual per PRD §13.5).
 * Auto-starts `pnpm dev` if not already running.
 *
 * Projects:
 *   - marketing: Public marketing pages (hero, programs, coaches, stories, booking) — no auth
 *   - auth: Auth flows (admin login, redirects, rate limit)
 *   - admin: Authenticated admin CRUD (coaches, programs, stories)
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'marketing',
      testMatch: /(hero-reel|programs-grid|coach-flip|stories-carousel|booking-form|mobile-nav)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'auth',
      testMatch: /(auth-flow|rate-limit)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: /(admin-coach-crud|admin-program-crud|admin-story-crud)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
