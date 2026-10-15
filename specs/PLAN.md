# Application Plan

The design this application is built to. Sections:

- **Purpose** — what it is for, and who uses it.
- **Entities** — the Dataverse tables needed, their columns and relationships.
  Reuse anything `SCHEMA.md` already lists.
- **Screens and routes**.
- **Data flow** — which screen reads or writes which entity.
- **Non-functional constraints** — performance, permissions, offline, ...
- **Open questions** — what the story left ambiguous. Note them; do not block.

---

## US-117912 — To Do App

### Purpose

A single-user to-do list app so an end user can track tasks they need to do,
organized by date. Data is persisted in Dataverse (not local storage), so the
list survives reloads and is available across sessions/devices for the signed
-in user. This is the first story in the repo — no prior schema or features
exist yet.

### Entities

New table: **`asdlc_us117912_todo`** (display name `ASDLC To Do`)

| Column (logical name) | Type | Notes |
|---|---|---|
| `asdlc_us117912_todoid` | GUID (primary key) | auto |
| `asdlc_us117912_title` | Single line text (required) | the task text |
| `asdlc_us117912_notes` | Multiple lines of text (optional) | extra detail |
| `asdlc_us117912_duedate` | Date only | the date the task is tracked against; this is the field the list is organized/filtered by |
| `asdlc_us117912_iscompleted` | Boolean (`BooleanType`) | default `false`; checked off by the user |
| `createdon` | system (read-only) | used for default ordering within a date |

No relationships — single flat table, one row per to-do item, owned by the
signed-in user (Dataverse row-level ownership/security is relied on for
per-user isolation; no custom "owner" column needed).

This is the first entry for this story; it will be logged to `SCHEMA.md` by
the Dev Agent once the table is created (schema is created live against
Dataverse, not via git).

### Screens and routes

- **`/` (Home / To Do list)** — replaces the current scaffold `HomePage`.
  Single screen app:
  - Header: current date context + "Add task" button opening a dialog/form
    (title, optional notes, due date — defaults to today).
  - Body: tasks grouped/sorted by due date (e.g. "Overdue", "Today",
    "Tomorrow", "Upcoming", grouped headers), each task row shows a checkbox
    to toggle complete, title, due date, and a delete action.
  - Optional simple date filter/picker to jump to a specific day (keeps scope
    small: a calendar popover that filters the list to the selected date, with
    a "Show all" toggle to go back to the grouped view).
  - Edit: clicking a task opens the same dialog pre-filled to edit
    title/notes/due date.
- **`/not-found`** — existing `NotFoundPage`, unchanged.

No other routes are required for this story; it is intentionally a single
-screen app per the "keep track of my to do list by date" requirement.

### Data flow

| Screen/component | Reads | Writes |
|---|---|---|
| To Do list (`/`) | `asdlc_us117912_todo` (all rows for the grouped view) | — |
| Add-task dialog | — | creates `asdlc_us117912_todo` row |
| Edit-task dialog | `asdlc_us117912_todo` (single row, prefill) | updates `asdlc_us117912_todo` row |
| Task row checkbox | — | updates `asdlc_us117912_todo.asdlc_us117912_iscompleted` |
| Task row delete | — | deletes `asdlc_us117912_todo` row |
| Date filter popover | client-side filter over already-fetched rows | — |

All reads/writes go through `src/services/dataverse.ts` wrapping the
generated `Asdlc_us117912_todosService`, and Tanstack Query hooks per the
pattern in `DATAVERSE.md`.

### Non-functional constraints

- **Persistence:** all data lives in Dataverse; no localStorage/sessionStorage
  as the system of record (acceptable as a Tanstack Query cache only).
- **Performance:** list fetch is a single `getAll` call ordered by
  `asdlc_us117912_duedate asc, createdon asc`; no pagination needed for a
  personal to-do list (cap at `top: 500` as a safety limit).
- **Permissions:** relies on standard Dataverse row ownership — a signed-in
  user sees their own rows. No extra role/permission screen in scope.
- **Offline:** not supported; app requires connectivity to Dataverse, same as
  the template baseline.
- **Accessibility/testability:** every interactive element (add button,
  dialog inputs, submit, checkbox, delete button, task row, date filter)
  carries a stable `data-testid` per `E2E.md`.

### Open questions

- "Keep track by date" is interpreted as grouping/filtering by a single due
  date field rather than a date range or recurring schedule — reasonable
  default for a to-do list, not blocking.
- No explicit multi-user/sharing requirement was given; per-user Dataverse
  ownership is assumed sufficient and no sharing UI is built.
- No explicit priority/category requirement; left out of scope to keep the
  story commit-sized. Can be added as a follow-up story.
