import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/** Web smoke tests against the exported web build (`pnpm build:web` first). Phone viewports per M1 gate. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `node scripts/serve-static.ts apps/game/dist/web ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'small-phone', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } },
    { name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
});
