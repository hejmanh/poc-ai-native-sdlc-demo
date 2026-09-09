/** The deployed play URL. Set by the orchestrator per story. */
export const APP_URL = process.env.E2E_BASE_URL ?? '';

/**
 * The app renders inside this iframe; everything outside it is the Power Apps
 * player shell. App locators must go through it — see AppPage.app in fixtures.
 */
export const APP_FRAME_SELECTOR = 'iframe[name="fullscreen-app-host"]';
