import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

const listTodosMock = vi.fn()
const createTodoMock = vi.fn()
const updateTodoMock = vi.fn()
const removeTodoMock = vi.fn()
const toggleTodoCompletedMock = vi.fn()

vi.mock("@/services/dataverse", () => ({
  listTodos: (...args: unknown[]) => listTodosMock(...args),
  createTodo: (...args: unknown[]) => createTodoMock(...args),
  updateTodo: (...args: unknown[]) => updateTodoMock(...args),
  removeTodo: (...args: unknown[]) => removeTodoMock(...args),
  toggleTodoCompleted: (...args: unknown[]) => toggleTodoCompletedMock(...args),
}))

import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleTodoCompleted,
} from "./use-todos"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("use-todos hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("useTodos returns the fetched list", async () => {
    const rows = [{ asdlc_us117912_todoid: "1", asdlc_us117912_title: "Task" }]
    listTodosMock.mockResolvedValue(rows)

    const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(rows)
  })

  it("useCreateTodo calls createTodo and invalidates on success", async () => {
    createTodoMock.mockResolvedValue({ asdlc_us117912_todoid: "new" })

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        asdlc_us117912_title: "New task",
        asdlc_us117912_duedate: "2024-01-01",
      })
    })

    expect(createTodoMock).toHaveBeenCalledWith({
      asdlc_us117912_title: "New task",
      asdlc_us117912_duedate: "2024-01-01",
    })
  })

  it("useUpdateTodo calls updateTodo with id and patch", async () => {
    updateTodoMock.mockResolvedValue({ asdlc_us117912_todoid: "1" })

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: "1", patch: { asdlc_us117912_title: "Edited" } })
    })

    expect(updateTodoMock).toHaveBeenCalledWith("1", { asdlc_us117912_title: "Edited" })
  })

  it("useToggleTodoCompleted calls toggleTodoCompleted", async () => {
    toggleTodoCompletedMock.mockResolvedValue({ asdlc_us117912_todoid: "1" })

    const { result } = renderHook(() => useToggleTodoCompleted(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: "1", isCompleted: true })
    })

    expect(toggleTodoCompletedMock).toHaveBeenCalledWith("1", true)
  })

  it("useDeleteTodo calls removeTodo with id", async () => {
    removeTodoMock.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync("1")
    })

    expect(removeTodoMock).toHaveBeenCalledWith("1")
  })
})
