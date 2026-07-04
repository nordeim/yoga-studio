import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Stillwater · Yoga Studio — Vitest configuration.
 *
 * Co-located unit tests live next to source: `*.test.ts` / `*.test.tsx`.
 * The setup file (`src/tests/setup.ts`) is intentionally minimal — we add
 * globals here so test files don't need to import `describe`/`it`/`expect`.
 *
 * Per PAD §8.2, the priority test surface is `src/lib/actions/first-class.ts`
 * (Zod schema, rate limiter, honeypot). Component tests are deferred until
 * @testing-library/react is added (PAD §11, HIGH-priority gap).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/tests/unit/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],
    exclude: ['node_modules/**', '.next/**', 'skills/**', 'yoga-studio/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
