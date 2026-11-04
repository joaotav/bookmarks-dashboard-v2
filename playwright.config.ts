import { defineConfig } from '@playwright/test';

// Runs the built Chrome extension in Playwright's Chromium. `npm run test:e2e` builds it first.
// Firefox can't load extension pages under automation, so Firefox is checked by hand.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
