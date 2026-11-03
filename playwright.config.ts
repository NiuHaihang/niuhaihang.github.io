import { defineConfig } from '@playwright/test';

/**
 * E2E drives the Chrome that is already installed on the machine — no
 * 150 MB browser download, and it is the same engine the kid will use.
 */
export default defineConfig({
  testDir: './e2e',
  // A full 18-question round takes ~45 s; give it room when workers compete.
  timeout: 180_000,
  fullyParallel: true,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: 'chrome',
    trace: 'retain-on-failure',
    viewport: { width: 1180, height: 820 },
  },
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
