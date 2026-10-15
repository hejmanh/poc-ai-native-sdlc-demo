/**
 * Data-access client for the `asdlc_us117912_todo` table.
 *
 * All Dataverse row CRUD for the To Do app lives here. React components and
 * hooks must never import from `@/generated` directly — they go through the
 * functions exported below.
 */
import { Asdlc_us117912_todosService } from "@/generated"
import type {
  Asdlc_us117912_todos,
  Asdlc_us117912_todosBase,
} from "@/generated/models/Asdlc_us117912_todosModel"
import type { IOperationResult } from "@microsoft/power-apps/data"

/** Row shape re-exported so components import it from here, not from generated code. */
export type Todo = Asdlc_us117912_todos

/** The columns a caller may set when creating a to-do; the rest are filled by Dataverse. */
export type NewTodo = Pick<
  Asdlc_us117912_todosBase,
  "asdlc_us117912_title" | "asdlc_us117912_duedate"
> &
  Partial<Pick<Asdlc_us117912_todosBase, "asdlc_us117912_notes" | "asdlc_us117912_iscompleted">>

/** The columns a caller may patch on an existing to-do. */
export type TodoPatch = Partial<
  Pick<
    Asdlc_us117912_todosBase,
    | "asdlc_us117912_title"
    | "asdlc_us117912_notes"
    | "asdlc_us117912_duedate"
    | "asdlc_us117912_iscompleted"
  >
>

type TodoWrite = Omit<Asdlc_us117912_todosBase, "asdlc_us117912_todoid">

const SELECT = [
  "asdlc_us117912_todoid",
  "asdlc_us117912_title",
  "asdlc_us117912_notes",
  "asdlc_us117912_duedate",
  "asdlc_us117912_iscompleted",
  "createdon",
]

/** Unwrap IOperationResult, turning a failed call into a thrown error. */
function unwrap<T>(result: IOperationResult<T>): T {
  if (!result.success) {
    throw result.error ?? new Error("Dataverse operation failed")
  }
  return result.data
}


/** List all to-dos, ordered by due date then creation time. */
export async function listTodos(): Promise<Todo[]> {
  return unwrap(
    await Asdlc_us117912_todosService.getAll({
      select: SELECT,
      orderBy: ["asdlc_us117912_duedate asc", "createdon asc"],
      top: 500,
    }),
  )
}

/** Retrieve one to-do by its GUID. */
export async function getTodo(id: string): Promise<Todo> {
  return unwrap(await Asdlc_us117912_todosService.get(id, { select: SELECT }))
}

/**
 * Insert a to-do; returns the created row (including its new GUID).
 * The cast is required: the generated Base type marks the system columns
 * (`ownerid`, `owneridtype`, `statecode`) as required, but Dataverse sets them.
 */
export async function createTodo(row: NewTodo): Promise<Todo> {
  return unwrap(await Asdlc_us117912_todosService.create(row as TodoWrite))
}

/** Patch a to-do in place. */
export async function updateTodo(id: string, patch: TodoPatch): Promise<Todo> {
  return unwrap(
    await Asdlc_us117912_todosService.update(id, patch as Partial<TodoWrite>),
  )
}

/** Convenience wrapper to toggle the completed flag. */
export async function toggleTodoCompleted(id: string, isCompleted: boolean): Promise<Todo> {
  return updateTodo(id, { asdlc_us117912_iscompleted: isCompleted })
}

/** Delete a to-do by its GUID. */
export async function removeTodo(id: string): Promise<void> {
  await Asdlc_us117912_todosService.delete(id)
}
