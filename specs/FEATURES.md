# Feature Log

Minimal, append-only running log of implemented features — one short entry
per change, added by whichever agent implements it. This is the
spec-kit-lite "memory" that lets an agent with no prior context know what
already exists before starting the next task. Do not rewrite or remove past
entries; only append.

Copy `TEMPLATE.md` for the entry format.

---
## FEAT-001 — To Do App (US-117912)

- **Reference:** US-117912
- **Status:** Done
- **Summary:** Single-screen to-do list app on `/`. Users add/edit/delete
  tasks with a title, optional notes, and a due date; tasks are grouped into
  Overdue/Today/Tomorrow/Upcoming sections, can be checked off complete, and
  can be filtered to a single day via a calendar popover ("Show all" clears
  the filter). All data persists in Dataverse table `asdlc_us117912_todo`.
- **Files:** `src/services/dataverse.ts`, `src/hooks/use-todos.ts`,
  `src/lib/todo-grouping.ts`, `src/components/todo/*`, `src/pages/home.tsx`
  (replaces scaffold), plus generated client under `src/generated/` and
  `power.config.json`/`.power/`.
- **Notes:** Per-user isolation relies on standard Dataverse row ownership
  (no custom owner column). No priority/category fields; could be a
  follow-up story. List fetch is capped at `top: 500` rows (no pagination).

