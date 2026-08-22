import { defineConfig, devices } from '@playwright/test';

const isHosted = !!process.env.BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: isHosted ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 414, height: 896 }, // Mobile-first viewport
  },
  ...(isHosted
    ? {}
    : {
        webServer: {
          command: 'npx vercel dev --yes',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

