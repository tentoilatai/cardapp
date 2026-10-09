import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-1366',
      testMatch: '**/*.spec.ts',
      use: {
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'desktop-1920',
      testMatch: '**/*.spec.ts',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'mobile-iphone',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['iPhone 14'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'tablet-ipad',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['iPad (gen 7)'],
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'mobile-small',
      testMatch: '**/*.spec.ts',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 568 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
