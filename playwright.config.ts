import { defineConfig, devices } from '@playwright/test';
import { BROWSER_ARGS, BROWSER_CHANNEL } from './tests/e2e/browser-profile.js';
import { APP_URL } from './tests/e2e/config.js';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',

  /* The browser profile is one shared resource, and these tests write real
   * Dataverse rows. Both break under parallel workers. */
  fullyParallel: false,
  workers: 1,

  forbidOnly: isCI,
  retries: isCI ? 1 : 0,

  /* Power Apps cold starts are slow. */
  timeout: 180_000,
  expect: { timeout: 30_000 },

  /* json is parsed into the structured result; html is for humans.
   * `open: 'never'` — an auto-opening report blocks forever in a subprocess. */
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/e2e-report.json' }],
    ['html', { open: 'never' }],
  ],

  /* No webServer: the suite targets the deployed app, not localhost. */
  use: {
    baseURL: APP_URL,
    channel: BROWSER_CHANNEL,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: { args: BROWSER_ARGS },
  },

  projects: [
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: BROWSER_CHANNEL,
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
