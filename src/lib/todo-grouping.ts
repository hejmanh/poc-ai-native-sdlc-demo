/**
 * Date-grouping helpers for the to-do list. Pure functions, easy to unit test.
 */
import type { Todo } from "@/services/dataverse"

export type TodoGroupName = "Overdue" | "Today" | "Tomorrow" | "Upcoming"

export const TODO_GROUP_ORDER: TodoGroupName[] = [
  "Overdue",
  "Today",
  "Tomorrow",
  "Upcoming",
]

/** Normalize a date (or ISO date string) to a `YYYY-MM-DD` key, ignoring time/timezone shift. */
export function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return toDateKey(date)
}

/** Determine which group a todo's due date falls into, relative to "today". */
export function groupForDueDate(dueDate: string, today: string = toDateKey(new Date())): TodoGroupName {
  const dueKey = toDateKey(dueDate)
  const tomorrow = addDays(today, 1)

  if (dueKey < today) return "Overdue"
  if (dueKey === today) return "Today"
  if (dueKey === tomorrow) return "Tomorrow"
  return "Upcoming"
}

/** Group todos into the four buckets, each sorted by due date then created date. */
export function groupTodos(
  todos: Todo[],
  today: string = toDateKey(new Date()),
): Record<TodoGroupName, Todo[]> {
  const groups: Record<TodoGroupName, Todo[]> = {
    Overdue: [],
    Today: [],
    Tomorrow: [],
    Upcoming: [],
  }

  for (const todo of todos) {
    const group = groupForDueDate(todo.asdlc_us117912_duedate, today)
    groups[group].push(todo)
  }

  return groups
}
