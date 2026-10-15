# Test Plan

Append-only. Add one block per story; never rewrite or remove an existing one.

`Type` is `E2E` or `UNIT`. Only `E2E` rows become Playwright specs; `UNIT` rows
guide the co-located Vitest tests.

`Priority`:

| Priority | What belongs here |
|---|---|
| P0 | Revenue-critical workflows, security and permission paths, incidents that must not recur |
| P1 | Core user journeys, frequently broken functionality |
| P2 | Everything else — cosmetic states, rarely-used branches. Not automated unless trivially cheap |

Format:

```markdown
## US-<id> — <story title>

| ID | Feature | Test case | Type | Priority | Pre-condition | Test steps | Expected output |
|----|---------|-----------|------|----------|---------------|------------|-----------------|
| TC-001 | Task list | Create a task with a due date | E2E | P0 | Signed in; no task named "Report" exists | 1. Open /tasks 2. Click "New task" 3. Fill name="Report", due=tomorrow 4. Submit | Row "Report" appears with tomorrow's date; success toast shown |
```

---

## US-117912 — To Do App

| ID | Feature | Test case | Type | Priority | Pre-condition | Test steps | Expected output |
|----|---------|-----------|------|----------|---------------|------------|-----------------|
| TC-001 | To-do list | Create a task with a due date today | E2E | P0 | Signed in; no task named "Buy milk" exists | 1. Open `/` 2. Click `new-todo-button` 3. Fill title "Buy milk", leave due date as today 4. Click `todo-submit` | A `todo-row` containing "Buy milk" appears under the "Today" group; success toast shown |
| TC-002 | To-do list | Create a task with a future due date groups under Upcoming | E2E | P1 | Signed in; no task named "Plan trip" exists | 1. Open `/` 2. Click `new-todo-button` 3. Fill title "Plan trip", pick a due date 7 days from today 4. Click `todo-submit` | A `todo-row` containing "Plan trip" appears under the "Upcoming" group with the chosen date shown |
| TC-003 | To-do list | Required field validation on create | UNIT | P1 | n/a | 1. Render the add-task form 2. Submit with empty title 3. Submit with empty due date | Inline validation error shown for the missing field; `createTodo` is not called |
| TC-004 | To-do list | Mark a task complete via checkbox | E2E | P0 | Signed in; a task named "Buy milk" exists and is not completed | 1. Open `/` 2. Locate `todo-row` for "Buy milk" 3. Click its `todo-row-checkbox` | Checkbox shows checked state and persists after reloading `/` |
| TC-005 | To-do list | Edit a task's title and due date | E2E | P1 | Signed in; a task named "Plan trip" exists | 1. Open `/` 2. Click `todo-edit-button` on the "Plan trip" row 3. Change title to "Plan trip to Spain" 4. Change due date to tomorrow 5. Click `todo-submit` | Row now shows "Plan trip to Spain" grouped under "Tomorrow"; success toast shown |
| TC-006 | To-do list | Delete a task | E2E | P0 | Signed in; a task named "Buy milk" exists | 1. Open `/` 2. Click `todo-delete-button` on the "Buy milk" row 3. Confirm deletion | The `todo-row` for "Buy milk" no longer appears in `todo-list`; success toast shown |
| TC-007 | To-do list | Filter list to a specific date | E2E | P1 | Signed in; tasks exist on at least two different due dates | 1. Open `/` 2. Click `todo-date-filter` 3. Pick a date that has exactly one task 4. Observe list | Only the task(s) due on the picked date are shown; `todo-clear-filter` is visible |
| TC-008 | To-do list | Clear date filter returns to grouped view | E2E | P2 | Signed in; a date filter is currently applied | 1. With filter applied, click `todo-clear-filter` | Grouped view ("Overdue"/"Today"/"Tomorrow"/"Upcoming") is restored showing all tasks |
| TC-009 | Data access | Failed Dataverse read surfaces as thrown error | UNIT | P1 | n/a | 1. Mock generated `Asdlc_us117912_todosService.getAll` to resolve `{ success: false, error }` 2. Call `listTodos()` | The call rejects/throws rather than returning an empty array silently |
| TC-010 | To-do list | Empty state when no tasks exist | E2E | P2 | Signed in; all tasks deleted for this user | 1. Open `/` with zero tasks | An empty-state message is shown instead of empty group headers |

