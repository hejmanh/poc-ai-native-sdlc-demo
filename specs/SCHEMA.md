# Dataverse Schema Log

Minimal, append-only running log of Dataverse schema (tables, columns,
relationships) created by each story — one entry per story, added by whichever
agent creates the schema. Do not rewrite or remove past entries; only append.

Dataverse schema is created via the Web API against a **shared environment**,
so — unlike the React source — it leaves no trace in git. This log is the
repo-visible record of what exists: skim it before creating schema so you can
reuse an existing table (e.g. a lookup target from an earlier story) and avoid
name clashes, and append to it after you create schema so the next story can do
the same.

Naming convention: schema names are
`asdlc_us<story_id>_<name>` (lowercase, alphanumeric + underscore only);
`DisplayName` carries the `ASDLC` prefix without the story id.

## Entry format

Copy this block to the bottom of the file and fill it in for the schema you
just created. Keep it short. Omit the Relationships line if there are none.

```
## US-<story_id> — <short title>

- **Tables:** <logical_name (DisplayName), …>
- **Columns:** <table.logical_name → col1, col2, … (one line per table)>
- **Relationships:** <schema_name: type, referenced ↔ referencing>
- **Notes:** <anything a future story needs: reused tables, lookups, deviations>
```

---

## US-117912 — To Do App

- **Tables:** asdlc_us117912_todo (ASDLC To Do)
- **Columns:** asdlc_us117912_todo → asdlc_us117912_title (primary name, required), asdlc_us117912_notes (multiline text, optional), asdlc_us117912_duedate (date only, required), asdlc_us117912_iscompleted (boolean, default false)
- **Notes:** Single flat table, user-owned, no relationships. Per-user isolation relies on standard Dataverse row ownership.

