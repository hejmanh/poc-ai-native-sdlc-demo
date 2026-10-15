/**
 * Tanstack Query hooks for the to-do list, built on `src/services/dataverse.ts`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listTodos,
  createTodo,
  updateTodo,
  removeTodo,
  toggleTodoCompleted,
  type NewTodo,
  type TodoPatch,
} from "@/services/dataverse"

export const TODOS_KEY = ["todos"] as const

/** Fetch all to-dos. */
export function useTodos() {
  return useQuery({ queryKey: TODOS_KEY, queryFn: listTodos })
}

/** Create a new to-do. */
export function useCreateTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: NewTodo) => createTodo(row),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

/** Update an existing to-do (title/notes/due date/completed). */
export function useUpdateTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TodoPatch }) => updateTodo(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

/** Toggle the completed flag on a to-do. */
export function useToggleTodoCompleted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      toggleTodoCompleted(id, isCompleted),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}

/** Delete a to-do. */
export function useDeleteTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeTodo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TODOS_KEY }),
  })
}
