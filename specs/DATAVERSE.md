# Dataverse data access

Reference pattern for reading and writing Dataverse **rows** from this app.
Read this before writing `src/services/dataverse.ts`.

Row CRUD is application code, not a tool: it lives in the repo so it is
versioned and reviewable. Table/column **schema** is created separately via the
Dataverse schema tools — see `SCHEMA.md`.

---

## How the data layer is assembled

Three layers, only the last of which you write by hand:

```
1. Dataverse table         created by the dataverse_* schema tools
                           (asdlc_us<story_id>_<name>)
        │
2. Generated client        created by `code_app_add_data_source`
        │
3. src/services/dataverse.ts   ← YOU WRITE THIS
                           thin, typed wrapper over the generated service
```

**A table is not reachable from the app until step 2 has run for it.** Creating
the table alone is not enough — the app has no idea it exists.

`code_app_add_data_source` writes/updates exactly these files:

| File | Contents |
|---|---|
| `power.config.json` | the table added to the app's data sources |
| `.power/schemas/dataverse/<name>.Schema.json` | the fetched table metadata |
| `.power/schemas/appschemas/dataSourcesInfo.ts` | runtime data-source map (entity-set name → primary key, type) |
| `src/generated/models/<Name>Model.ts` | row types + choice constants |
| `src/generated/models/CommonModels.ts` | `IGetOptions`, `IGetAllOptions` |
| `src/generated/services/<Name>Service.ts` | the typed CRUD service class |
| `src/generated/index.ts` | barrel re-export |

All of them are source and must be committed. Never hand-write or edit them —
they are regenerated and your edits are overwritten. Never call `getClient(...)`
yourself either; the generated service already does.

---

## The generated service

`<Name>` is derived from the table's **entity set (plural) name**, not the
logical name you passed. Table `asdlc_us1234_widget` → entity set
`asdlc_us1234_widgets` → `Asdlc_us1234_widgetsService`,
`Asdlc_us1234_widgetsModel.ts`. Read `src/generated/index.ts` after codegen to
confirm the emitted names instead of guessing:

```ts
// src/generated/index.ts — models are NAMESPACE exports, services are flat
export * as Asdlc_us1234_widgetsModel from './models/Asdlc_us1234_widgetsModel';
export * as CommonModels from './models/CommonModels';
export * from './services/Asdlc_us1234_widgetsService';
```

So the service imports from the barrel, but a row type must come from its own
module (or through the namespace). `verbatimModuleSyntax` is on, so type-only
imports must use `import type` or the build fails:

```ts
import { Asdlc_us1234_widgetsService } from "@/generated"
import type { Asdlc_us1234_widgets, Asdlc_us1234_widgetsBase } from "@/generated/models/Asdlc_us1234_widgetsModel"
```

### The two row types

Codegen emits **two** interfaces per table:

- `<Name>Base` — the writable columns (plus the primary id). Used for `create`
  and `update`.
- `<Name>` — extends `Base` with the read-only/system columns
  (`createdon`, `modifiedon`, `*name` formatted values, `_<lookup>_value`,
  `versionnumber`, …). Used for anything you read.

Column typing to expect: `BooleanType` → `boolean`; `DateTimeType` → ISO
`string`; choice/`statecode`/`statuscode` → a numeric union backed by a
generated const map (e.g. `0 | 1`); lookups → `"<SchemaName>@odata.bind"?:
string` when writing, `_<name>_value?: string` when reading.

### The service API

```ts
class <Name>Service {
  static getAll(options?: IGetAllOptions): Promise<IOperationResult<Model[]>>
  static get(id: string, options?: IGetOptions): Promise<IOperationResult<Model>>
  static create(record: Omit<ModelBase, '<primaryKey>'>): Promise<IOperationResult<Model>>
  static update(id: string, changedFields: Partial<Omit<ModelBase, '<primaryKey>'>>): Promise<IOperationResult<Model>>
  static delete(id: string): Promise<void>
  static getMetadata(options?): Promise<IOperationResult<Partial<EntityMetadata>>>
}
```

Three things differ from a typical REST client and cause most mistakes:

**Queries are structured objects, not OData strings.** There is no
`"?$select=…&$filter=…"` parameter anywhere in this SDK. The exact fields are in
`src/generated/models/CommonModels.ts`:

```ts
IGetOptions    { select?: string[] }
IGetAllOptions { select?: string[]      // column logical names
                 filter?: string        // OData filter expression, e.g. "statecode eq 0"
                 orderBy?: string[]     // e.g. ["createdon desc"]
                 top?: number
                 skip?: number
                 maxPageSize?: number
                 skipToken?: string }   // paging cursor
```

**Results are wrapped.** Every method except `delete` resolves to
`IOperationResult<T>` — it does **not** throw on a failed call:

```ts
{ success: boolean; data: T; error?: Error }
```

Check `success` and surface `error`. Ignoring it yields `undefined` rows and a
silent failure that looks like an empty table.

**`create` demands the system columns.** `<Name>Base` marks `ownerid`,
`owneridtype` and `statecode` as required even though Dataverse fills them
server-side, so a hand-built payload will not type-check. Declare your own
input type over the columns you actually set and cast at the call boundary —
see `createWidget` below.

---

## `src/services/dataverse.ts`

Wrap the generated service so React components never touch `IOperationResult`,
raw column logical names, or `src/generated/`. Keep the exported shape stable
(`list` / `get` / `create` / `update` / `remove`).

```ts
/**
 * Data-access client for the `asdlc_us1234_widget` table.
 */
import { Asdlc_us1234_widgetsService } from "@/generated"
import type {
  Asdlc_us1234_widgets,
  Asdlc_us1234_widgetsBase,
} from "@/generated/models/Asdlc_us1234_widgetsModel"

/** Row shape re-exported so components import it from here, not from generated code. */
export type Widget = Asdlc_us1234_widgets

/** The columns a caller may set; the rest are filled by Dataverse. */
export type NewWidget = Pick<
  Asdlc_us1234_widgetsBase,
  "asdlc_us1234_name" | "asdlc_us1234_quantity"
>

type WidgetWrite = Omit<Asdlc_us1234_widgetsBase, "asdlc_us1234_widgetid">

const SELECT = [
  "asdlc_us1234_widgetid",
  "asdlc_us1234_name",
  "asdlc_us1234_quantity",
  "createdon",
]

/** Unwrap IOperationResult, turning a failed call into a thrown error. */
function unwrap<T>(result: { success: boolean; data: T; error?: Error }): T {
  if (!result.success) {
    throw result.error ?? new Error("Dataverse operation failed")
  }
  return result.data
}

/** List widgets, most recently created first. */
export async function listWidgets(): Promise<Widget[]> {
  return unwrap(
    await Asdlc_us1234_widgetsService.getAll({
      select: SELECT,
      orderBy: ["createdon desc"],
    }),
  )
}

/** Retrieve one widget by its GUID. */
export async function getWidget(id: string): Promise<Widget> {
  return unwrap(await Asdlc_us1234_widgetsService.get(id, { select: SELECT }))
}

/**
 * Insert a widget; returns the created row (including its new GUID).
 * The cast is required: the generated Base type marks the system columns
 * (`ownerid`, `owneridtype`, `statecode`) as required, but Dataverse sets them.
 */
export async function createWidget(row: NewWidget): Promise<Widget> {
  return unwrap(await Asdlc_us1234_widgetsService.create(row as WidgetWrite))
}

/** Patch a widget in place. */
export async function updateWidget(
  id: string,
  patch: Partial<NewWidget>,
): Promise<Widget> {
  return unwrap(
    await Asdlc_us1234_widgetsService.update(id, patch as Partial<WidgetWrite>),
  )
}

/** Delete a widget by its GUID. */
export async function removeWidget(id: string): Promise<void> {
  await Asdlc_us1234_widgetsService.delete(id)
}
```

---

## Consuming from components

Tanstack Query is pre-wired (`src/providers/query-provider.tsx`). Write hooks
against the service module, then build components on the hooks — components
never import from `src/generated/` directly:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listWidgets, createWidget, type NewWidget } from "@/services/dataverse"

const WIDGETS_KEY = ["widgets"] as const

export function useWidgets() {
  return useQuery({ queryKey: WIDGETS_KEY, queryFn: listWidgets })
}

export function useCreateWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: NewWidget) => createWidget(row),
    onSuccess: () => qc.invalidateQueries({ queryKey: WIDGETS_KEY }),
  })
}
```

---

## Testing data access

Tests run in jsdom and must never reach Dataverse. Mock at the module boundary:

```ts
// component/hook tests — mock your own service module
vi.mock("@/services/dataverse", () => ({
  listWidgets: vi.fn().mockResolvedValue([]),
  createWidget: vi.fn(),
}))

// tests for src/services/dataverse.ts itself — mock the generated service
vi.mock("@/generated", () => ({
  Asdlc_us1234_widgetsService: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}))
```

Worth covering: a failed `IOperationResult` (`{ success: false, error }`) is
turned into a thrown error rather than silently rendering an empty list.

---

## Checklist

- [ ] Table created with the `asdlc_us<story_id>_<name>` convention, logged in `SCHEMA.md`
- [ ] `code_app_add_data_source` run for that table
- [ ] `src/generated/index.ts` read to confirm the emitted service/type names
- [ ] `src/services/dataverse.ts` written against those names, unwrapping `IOperationResult`
- [ ] Tanstack Query hooks call the service module; components call the hooks
- [ ] No row CRUD anywhere outside `src/services/dataverse.ts`
- [ ] Unit tests cover the service module and components, with Dataverse mocked
- [ ] `npm run build` and `npm test` pass, and `power.config.json`, `.power/`,
      `src/generated/` are committed
