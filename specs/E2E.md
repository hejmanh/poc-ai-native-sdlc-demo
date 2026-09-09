# Writing E2E tests

Reference for the Playwright specs in `tests/e2e/`. Read this before writing
your first spec: the two rules below fail **silently** if you get them wrong.

## The shape of a spec

Import `test` and `expect` from `./fixtures.js`, never from `@playwright/test`.
The fixture binds the run to the signed-in browser profile and attaches the
failure context you will need if it fails.

```ts
import { test, expect } from './fixtures.js';

test('TC-001 creates a task', async ({ appPage }) => {
  await appPage.app.getByTestId('new-task-button').click();
  await appPage.app.getByTestId('task-name-input').fill('Report');
  await appPage.app.getByTestId('task-submit').click();

  await expect(appPage.app.getByTestId('task-row').filter({ hasText: 'Report' }))
    .toBeVisible();
});
```

`appPage` has already navigated and waited for the app to render, so start
asserting immediately.

## Rule 1: locate through `appPage.app`

The app runs inside `iframe[name="fullscreen-app-host"]`; everything outside it
is the Power Apps player shell. `appPage.app` is a `FrameLocator` into the app.

A locator on `page` searches the shell, finds nothing, and times out — with no
error saying why. If a locator you are confident about times out, check this
first.

## Rule 2: locate by `data-testid`, not visible text

Every interactive element and every list/table row container carries a stable
testid. If one is missing, that is a finding about the application — report it
rather than falling back to a text locator.

## Test steps must be observable

Assert on something the UI shows: a row appearing, a value changing, an error
message. "It works" is not a test case.

## When a test fails

You get the error message, the failing step, and an **accessibility tree
snapshot taken inside the app frame** — a text rendering of what was actually
on screen. Read it before assuming the app is broken; most "element not found"
failures are a wrong locator, and the tree shows you the real one.

Screenshots are written to `test-results/` for humans. You cannot see images —
do not ask for them, and do not treat their absence as missing information.

## Constraints

- Tests run against the **deployed** app, not `localhost`. The Dataverse
  connection is injected by the Power Apps host page, so a local dev server has
  no data layer at all.
- Tests share one Dataverse environment and run serially. Clean up rows you
  create, and never assume the environment is empty.
- `--ui`, `--debug`, `--headed` and `codegen` open a GUI and block forever.
  Nothing you can call reaches them.
