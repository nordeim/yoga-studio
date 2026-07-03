import { defineConfig, devices } from '@playwright/test';

/**
 * IRONFORGE — Live-site E2E config.
 *
 * Targets the production deployment URL (set via IRONFORGE_LIVE_URL env or fallback).
 * Only runs specs matching `live-site.spec.ts` — the post-deploy smoke suite.
 * Run with: `pnpm test:e2e:live`
 */
const LIVE_URL = process.env.IRONFORGE_LIVE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: LIVE_URL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  testMatch: /live-site\.spec\.ts/,
});
