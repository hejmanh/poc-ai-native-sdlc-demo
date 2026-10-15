import { test, expect } from './fixtures.js';
import type { AppPage } from './fixtures.js';

function uniqueTitle(base: string): string {
  return `${base} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function createTodo(appPage: AppPage, title: string, dueDateKey: string): Promise<void> {
  await appPage.app.getByTestId('new-todo-button').click();
  await expect(appPage.app.getByTestId('todo-form-dialog')).toBeVisible();
  await appPage.app.getByTestId('todo-title-input').fill(title);
  await appPage.app.getByTestId('todo-duedate-input').fill(dueDateKey);
  await appPage.app.getByTestId('todo-submit').click();
  await expect(appPage.app.getByTestId('todo-form-dialog')).toBeHidden();
}

async function deleteTodoByTitle(appPage: AppPage, title: string): Promise<void> {
  const row = appPage.app.getByTestId('todo-row').filter({ hasText: title });
  if (!(await row.isVisible().catch(() => false))) return;
  await row.getByTestId('todo-delete-button').click();
  await expect(appPage.app.getByTestId('todo-delete-dialog')).toBeVisible();
  await appPage.app.getByTestId('todo-delete-confirm').click();
  await expect(appPage.app.getByTestId('todo-delete-dialog')).toBeHidden();
}

test.describe('To Do App', () => {
  // TC-001 (P0): create a task due today, grouped under "Today".
  test('TC-001 creates a task with a due date today', async ({ appPage }) => {
    const title = uniqueTitle('Buy milk');
    try {
      await createTodo(appPage, title, todayKey());

      const row = appPage.app.getByTestId('todo-row').filter({ hasText: title });
      await expect(row).toBeVisible();

      const todayHeader = appPage.app
        .getByTestId('todo-group-header')
        .filter({ hasText: 'Today' });
      await expect(todayHeader).toBeVisible();
    } finally {
      await deleteTodoByTitle(appPage, title);
    }
  });

  // TC-004 (P0): mark a task complete via checkbox, persists after reload.
  test('TC-004 marks a task complete via checkbox and persists on reload', async ({
    appPage,
  }) => {
    const title = uniqueTitle('Buy milk');
    try {
      await createTodo(appPage, title, todayKey());

      const row = appPage.app.getByTestId('todo-row').filter({ hasText: title });
      await expect(row).toBeVisible();
      const checkbox = row.getByTestId('todo-row-checkbox');
      await checkbox.click();
      await expect(checkbox).toHaveAttribute('data-state', 'checked');

      await appPage.goto();
      await appPage.waitForAppReady();

      const rowAfterReload = appPage.app.getByTestId('todo-row').filter({ hasText: title });
      await expect(rowAfterReload).toBeVisible();
      await expect(rowAfterReload.getByTestId('todo-row-checkbox')).toHaveAttribute(
        'data-state',
        'checked',
      );
    } finally {
      await deleteTodoByTitle(appPage, title);
    }
  });

  // TC-006 (P0): delete a task.
  test('TC-006 deletes a task', async ({ appPage }) => {
    const title = uniqueTitle('Buy milk');
    await createTodo(appPage, title, todayKey());

    const row = appPage.app.getByTestId('todo-row').filter({ hasText: title });
    await expect(row).toBeVisible();

    await row.getByTestId('todo-delete-button').click();
    await expect(appPage.app.getByTestId('todo-delete-dialog')).toBeVisible();
    await appPage.app.getByTestId('todo-delete-confirm').click();

    await expect(appPage.app.getByTestId('todo-delete-dialog')).toBeHidden();
    await expect(
      appPage.app.getByTestId('todo-list').getByTestId('todo-row').filter({ hasText: title }),
    ).toHaveCount(0);
  });

  // TC-002 (P1): create a task with a future due date, grouped under "Upcoming".
  test('TC-002 creates a task with a future due date grouped under Upcoming', async ({
    appPage,
  }) => {
    const title = uniqueTitle('Plan trip');
    const dueDate = addDaysKey(7);
    try {
      await createTodo(appPage, title, dueDate);

      const row = appPage.app.getByTestId('todo-row').filter({ hasText: title });
      await expect(row).toBeVisible();
      await expect(row).toContainText(dueDate);

      const upcomingHeader = appPage.app
        .getByTestId('todo-group-header')
        .filter({ hasText: 'Upcoming' });
      await expect(upcomingHeader).toBeVisible();
    } finally {
      await deleteTodoByTitle(appPage, title);
    }
  });

  // TC-005 (P1): edit a task's title and due date.
  test("TC-005 edits a task's title and due date", async ({ appPage }) => {
    const title = uniqueTitle('Plan trip');
    const editedTitle = `${title} to Spain`;
    try {
      await createTodo(appPage, title, addDaysKey(7));

      const row = appPage.app.getByTestId('todo-row').filter({ hasText: title });
      await expect(row).toBeVisible();
      await row.getByTestId('todo-edit-button').click();

      await expect(appPage.app.getByTestId('todo-form-dialog')).toBeVisible();
      await appPage.app.getByTestId('todo-title-input').fill(editedTitle);
      await appPage.app.getByTestId('todo-duedate-input').fill(addDaysKey(1));
      await appPage.app.getByTestId('todo-submit').click();
      await expect(appPage.app.getByTestId('todo-form-dialog')).toBeHidden();

      const editedRow = appPage.app.getByTestId('todo-row').filter({ hasText: editedTitle });
      await expect(editedRow).toBeVisible();

      const tomorrowHeader = appPage.app
        .getByTestId('todo-group-header')
        .filter({ hasText: 'Tomorrow' });
      await expect(tomorrowHeader).toBeVisible();
    } finally {
      await deleteTodoByTitle(appPage, editedTitle);
      await deleteTodoByTitle(appPage, title);
    }
  });

  // TC-007 (P1): filter the list to a specific date.
  test('TC-007 filters list to a specific date', async ({ appPage }) => {
    const titleA = uniqueTitle('Filter task A');
    const titleB = uniqueTitle('Filter task B');
    const dateA = addDaysKey(3);
    const dateB = addDaysKey(10);
    try {
      await createTodo(appPage, titleA, dateA);
      await createTodo(appPage, titleB, dateB);

      await appPage.app.getByTestId('todo-date-filter').click();

      // Build a locale-independent match for the day cell: weekday + month name + day number + year,
      // ignoring ordinal suffixes ("17th") and prefixes like "Today," or ", selected".
      const target = new Date(`${dateA}T00:00:00`);
      const weekday = target.toLocaleDateString('en-US', { weekday: 'long' });
      const month = target.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = target.getDate();
      const year = target.getFullYear();
      const nameRegex = new RegExp(`${weekday}, ${month} ${dayNum}\\w*, ${year}`);
      await appPage.app.getByRole('gridcell', { name: nameRegex }).getByRole('button').click();

      await expect(appPage.app.getByTestId('todo-clear-filter')).toBeVisible();

      const rowA = appPage.app.getByTestId('todo-row').filter({ hasText: titleA });
      const rowB = appPage.app.getByTestId('todo-row').filter({ hasText: titleB });
      await expect(rowA).toBeVisible();
      await expect(rowB).toHaveCount(0);

      await appPage.app.getByTestId('todo-clear-filter').click();
      await expect(appPage.app.getByTestId('todo-clear-filter')).toHaveCount(0);
      await expect(rowB).toBeVisible();
    } finally {
      await deleteTodoByTitle(appPage, titleA);
      await deleteTodoByTitle(appPage, titleB);
    }
  });
});
