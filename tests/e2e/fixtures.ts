import {
  chromium,
  test as base,
  expect,
  type BrowserContext,
  type FrameLocator,
  type Page,
} from '@playwright/test';
import { BROWSER_ARGS, profileDir, profileExists } from './browser-profile.js';
import { APP_FRAME_SELECTOR, APP_URL } from './config.js';

/** Page object for the deployed app. */
export class AppPage {
  constructor(readonly page: Page) {}

  /**
   * Use this for EVERY app locator. A locator on `page` searches the player
   * shell instead of the app and finds nothing — no error, just a timeout.
   */
  get app(): FrameLocator {
    return this.page.frameLocator(APP_FRAME_SELECTOR);
  }

  /** Player shell header, outside the app. */
  get shellHeader() {
    return this.page.getByRole('banner');
  }

  get accountButton() {
    return this.page.getByRole('button', { name: /Account manager/i });
  }

  async goto(url: string = APP_URL): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async isSignedIn(): Promise<boolean> {
    return this.accountButton.isVisible().catch(() => false);
  }

  /**
   * The iframe attaches long before the app renders in it, so wait for content
   * inside the frame. Never wait for networkidle — Power Apps holds long-poll
   * connections open, so it never fires.
   */
  async waitForAppReady(timeout = 90_000): Promise<void> {
    await expect(this.shellHeader).toBeVisible({ timeout });
    await expect(this.page.locator(APP_FRAME_SELECTOR)).toBeAttached({ timeout });
    await expect(this.app.locator('#root')).toBeVisible({ timeout });
  }

  /** Everything the app renders, as text. Useful when a locator misses. */
  async appText(): Promise<string> {
    return (await this.app.locator('body').innerText()).trim();
  }
}

type AppFixtures = {
  appPage: AppPage;
};

type WorkerFixtures = {
  /** One signed-in browser for the whole run, not one per test. */
  sharedContext: BrowserContext;
};

/** Runs every test in a persistent context bound to the signed-in profile. */
export const test = base.extend<AppFixtures, WorkerFixtures>({
  sharedContext: [
    async ({ headless, channel, launchOptions }, use) => {
      const dir = profileDir();
      if (!profileExists()) {
        throw new Error(`No signed-in browser profile at ${dir}.`);
      }

      const context = await chromium.launchPersistentContext(dir, {
        ...launchOptions,
        channel,
        headless,
        viewport: { width: 1920, height: 1080 },
        baseURL: APP_URL,
        args: [...BROWSER_ARGS, ...(launchOptions.args ?? [])],
      });

      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Test-scoped, backed by the one worker-scoped launch above — doc/DESIGN_V4.md §7.7.4.
  context: async ({ sharedContext }, use) => {
    await use(sharedContext);
  },

  page: async ({ context }, use) => {
    await use(context.pages()[0] ?? (await context.newPage()));
  },

  /** Already navigated and rendered — specs start with the app mounted. */
  appPage: async ({ page }, use) => {
    const appPage = new AppPage(page);
    await appPage.goto();
    await appPage.waitForAppReady();
    await use(appPage);
  },
});

/**
 * Attach the accessibility tree as text on failure — taken inside the app
 * frame, since a top-level snapshot would capture only the player shell.
 * This is the failure context the reviewing agent gets; it cannot see the
 * screenshots Playwright writes alongside it.
 */
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  const snapshot = await page
    .frameLocator(APP_FRAME_SELECTOR)
    .locator('body')
    .ariaSnapshot()
    .catch(() => null);

  if (snapshot) {
    await testInfo.attach('aria-snapshot (app iframe)', {
      body: snapshot,
      contentType: 'text/plain',
    });
  }
});

export { expect };
