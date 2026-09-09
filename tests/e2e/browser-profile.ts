import fs from 'node:fs';
import path from 'node:path';

/**
 * The signed-in browser profile every test runs in. One per machine, created
 * by the operator and shared by every workspace; E2E_PROFILE_DIR points at it.
 *
 * Resolved lazily so `playwright test --list` still works without it set.
 */
export function profileDir(): string {
  const configured = process.env.E2E_PROFILE_DIR;
  if (!configured) {
    throw new Error('E2E_PROFILE_DIR is not set. It must point at the browser profile.');
  }
  return path.resolve(configured);
}

export function profileExists(): boolean {
  const dir = profileDir();
  return fs.existsSync(path.join(dir, 'Default')) || fs.existsSync(path.join(dir, 'Local State'));
}

/**
 * DO NOT REMOVE the first two flags. The app renders in a cross-origin iframe
 * and reads localStorage from there; under default storage partitioning that
 * throws SecurityError and the app stays permanently BLANK — the page loads,
 * the iframe mounts, nothing renders. Every assertion then fails for a reason
 * that looks nothing like its cause.
 */
export const BROWSER_ARGS: string[] = [
  '--disable-features=ThirdPartyStoragePartitioning,TrackingProtection3pcd',
  '--disable-third-party-cookie-blocking',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-session-crashed-bubble',
  '--hide-crash-restore-bubble',
];

/** System-installed Edge, never a Playwright-bundled browser. */
export const BROWSER_CHANNEL = process.env.E2E_BROWSER_CHANNEL ?? 'msedge';
