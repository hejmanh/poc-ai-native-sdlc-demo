import {
  chromium,
  test as base,
  expect,
  type BrowserContext,
  type ConsoleMessage,
  type FrameLocator,
  type Page,
  type Response,
} from '@playwright/test';
import { BROWSER_ARGS, profileDir, profileExists } from './browser-profile.js';
import { APP_FRAME_SELECTOR, APP_URL } from './config.js';

const MAX_DIAGNOSTIC_ENTRIES = 20;
const MAX_DIAGNOSTIC_TEXT = 2_000;
const SENSITIVE_QUERY_KEY = /token|secret|password|authorization|api[-_]?key|signature|sig|code/i;

type HttpFailure = {
  method: string;
  status: number;
  url: string;
  response_preview?: string;
};

type AgentDiagnostics = {
  http_failures: HttpFailure[];
  console_errors: string[];
  page_errors: string[];
  current_url?: string;
  pending: Promise<void>[];
};

function bounded(value: string): string {
  return value.length <= MAX_DIAGNOSTIC_TEXT
    ? value
    : `${value.slice(0, MAX_DIAGNOSTIC_TEXT)}\n... [truncated]`;
}

function redactText(value: string): string {
  return bounded(value)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer <redacted>')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '<redacted-jwt>')
    .replace(
      /(token|secret|password|authorization|api[-_]?key)(\s*[=:]\s*)[^\s,;]+/gi,
      '$1$2<redacted>',
    );
}

function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    for (const key of url.searchParams.keys()) {
      if (SENSITIVE_QUERY_KEY.test(key)) url.searchParams.set(key, '<redacted>');
    }
    return bounded(url.toString());
  } catch {
    return redactText(value);
  }
}

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
  /** Text-only evidence returned to the autonomous Test Agent on failure. */
  agentDiagnostics: AgentDiagnostics;
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

  agentDiagnostics: [
    async ({ page }, use) => {
      const diagnostics: AgentDiagnostics = {
        http_failures: [],
        console_errors: [],
        page_errors: [],
        pending: [],
      };

      const onResponse = (response: Response) => {
        if (response.status() < 400 || diagnostics.http_failures.length >= MAX_DIAGNOSTIC_ENTRIES) {
          return;
        }
        const resourceType = response.request().resourceType();
        if (!['document', 'fetch', 'xhr'].includes(resourceType)) return;

        const item: HttpFailure = {
          method: response.request().method(),
          status: response.status(),
          url: redactUrl(response.url()),
        };
        diagnostics.http_failures.push(item);

        const captureBody = (async () => {
          const contentType = response.headers()['content-type'] ?? '';
          if (!/json|text|xml|odata/i.test(contentType)) return;
          const body = await response.text().catch(() => '');
          if (body) item.response_preview = redactText(body);
        })();
        diagnostics.pending.push(captureBody);
      };

      const onConsole = (message: ConsoleMessage) => {
        if (!['error', 'warning'].includes(message.type())) return;
        if (diagnostics.console_errors.length >= MAX_DIAGNOSTIC_ENTRIES) return;
        const location = message.location();
        const suffix = location.url
          ? ` (${redactUrl(location.url)}:${location.lineNumber}:${location.columnNumber})`
          : '';
        diagnostics.console_errors.push(redactText(`${message.type()}: ${message.text()}${suffix}`));
      };

      const onPageError = (error: Error) => {
        if (diagnostics.page_errors.length >= MAX_DIAGNOSTIC_ENTRIES) return;
        diagnostics.page_errors.push(redactText(error.stack || error.message));
      };

      page.on('response', onResponse);
      page.on('console', onConsole);
      page.on('pageerror', onPageError);
      await use(diagnostics);
      page.off('response', onResponse);
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
    },
    { auto: true },
  ],

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
test.afterEach(async ({ page, agentDiagnostics }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  await Promise.allSettled(agentDiagnostics.pending);
  agentDiagnostics.current_url = redactUrl(page.url());

  await testInfo.attach('agent-diagnostics', {
    body: JSON.stringify({
      http_failures: agentDiagnostics.http_failures,
      console_errors: agentDiagnostics.console_errors,
      page_errors: agentDiagnostics.page_errors,
      current_url: agentDiagnostics.current_url,
    }),
    contentType: 'application/json',
  });

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
