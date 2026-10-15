# Implementation Tasks

Ordered breakdown, worked through in order with a commit after each task.

Each task is commit-sized: one coherent change that can be built, tested and
committed on its own. Dependencies come first — schema before data access,
data access before screens.

Format:

```markdown
## US-<id> — <story title>

- **T-001** — <title>
  <optional description>
- **T-002** — <title>
```

---

## US-117912 — To Do App

- **T-001** — Create the `asdlc_us117912_todo` Dataverse table
  Create table `asdlc_us117912_todo` (display name `ASDLC To Do`) with columns
  `asdlc_us117912_title` (text, required), `asdlc_us117912_notes` (multiline
  text, optional), `asdlc_us117912_duedate` (date only, required), and
  `asdlc_us117912_iscompleted` (boolean, default false). Log the table and
  columns to `specs/SCHEMA.md`.

- **T-002** — Generate the data source and write `src/services/dataverse.ts`
  Run `code_app_add_data_source` for `asdlc_us117912_todo`, confirm the emitted
  names in `src/generated/index.ts`, then write
  `src/services/dataverse.ts` exposing `listTodos`, `createTodo`,
  `updateTodo`, `removeTodo` (and `toggleTodoCompleted` convenience wrapper)
  per the pattern in `specs/DATAVERSE.md`, unwrapping `IOperationResult` and
  throwing on failure. Add unit tests for this module mocking the generated
  service.

- **T-003** — Tanstack Query hooks for to-dos
  Add `src/hooks/use-todos.ts` (or similar) with `useTodos()`,
  `useCreateTodo()`, `useUpdateTodo()`, `useDeleteTodo()` built on the service
  module from T-002, invalidating the todos query key on mutation success.
  Unit-test the hooks with the service module mocked (React Testing Library +
  Tanstack Query test wrapper).

- **T-004** — To-do list screen: grouped read-only view
  Replace `src/pages/home.tsx` with the to-do list screen: fetch todos with
  `useTodos()`, group into "Overdue" / "Today" / "Tomorrow" / "Upcoming"
  sections by `asdlc_us117912_duedate` compared to today, render each as a row
  with title, due date and a completed checkbox (wired to
  `useUpdateTodo`/toggle, not yet wired to add/delete). Empty state message
  when there are no todos. Add `data-testid`s: `todo-list`, `todo-row`,
  `todo-row-checkbox`, `todo-group-header`. Update `src/router.tsx` only if
  the route path changes (it does not — stays on `/`).

- **T-005** — Add-task dialog
  Add a "New task" button (`data-testid="new-todo-button"`) opening a
  `Dialog` with fields title (required), notes (optional), due date (date
  picker, defaults to today) and a submit button
  (`data-testid="todo-submit"`), calling `useCreateTodo()`. On success, close
  the dialog, show a `sonner` success toast, and let Tanstack Query
  invalidation refresh the list. Validate: title required, due date required;
  show inline error text (not just disabled submit) when invalid.

- **T-006** — Edit-task dialog and delete action
  Clicking a task row (or an explicit edit icon button,
  `data-testid="todo-edit-button"`) opens the same dialog component from
  T-005 in edit mode, pre-filled, calling `useUpdateTodo()` on submit. Add a
  delete button per row (`data-testid="todo-delete-button"`) that calls
  `useDeleteTodo()` after a confirmation (simple `Dialog`/`AlertDialog`-style
  confirm, or a window-free inline confirm state — no native `confirm()`),
  with a success toast on deletion.

- **T-007** — Date filter popover
  Add a calendar popover (`data-testid="todo-date-filter"`, using the existing
  `components/ui/calendar.tsx` + `popover.tsx`) that, when a date is picked,
  filters the visible list to just that date's tasks (client-side filter over
  the already-fetched rows) and shows a "Show all" button
  (`data-testid="todo-clear-filter"`) to return to the grouped view.

- **T-008** — Polish, loading/error states, and full test pass
  Add loading skeleton (reuse `components/ui/skeleton.tsx`) and an error
  state (toast + inline message) for the list query. Run `npm run build`,
  `npm test`, and `npm run lint`; fix any failures. Confirm `power.config.json`,
  `.power/`, and `src/generated/` are committed. Append a `FEATURES.md` entry
  summarizing the to-do app.
