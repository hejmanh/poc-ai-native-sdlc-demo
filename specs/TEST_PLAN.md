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
