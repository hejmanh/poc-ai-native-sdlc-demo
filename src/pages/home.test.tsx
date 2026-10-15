import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import HomePage from "./home"
import type { Todo } from "@/services/dataverse"

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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    asdlc_us117912_todoid: "1",
    asdlc_us117912_title: "Buy milk",
    asdlc_us117912_duedate: "2024-06-15",
    asdlc_us117912_iscompleted: false,
    ...overrides,
  } as Todo
}

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<HomePage />, { wrapper })
}

describe("HomePage - to do list", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the empty state when there are no todos", async () => {
    listTodosMock.mockResolvedValue([])
    renderHome()

    await waitFor(() => expect(screen.getByTestId("todo-empty-state")).toBeInTheDocument())
  })

  it("renders fetched todos grouped by due date", async () => {
    listTodosMock.mockResolvedValue([makeTodo()])
    renderHome()

    await waitFor(() => expect(screen.getAllByTestId("todo-row")).toHaveLength(1))
    expect(screen.getByText("Buy milk")).toBeInTheDocument()
    expect(screen.getAllByTestId("todo-group-header")[0]).toBeInTheDocument()
  })

  it("shows an error message when the list query fails", async () => {
    listTodosMock.mockRejectedValue(new Error("network down"))
    renderHome()

    await waitFor(() => expect(screen.getByTestId("todo-error")).toBeInTheDocument())
    expect(screen.getByTestId("todo-error")).toHaveTextContent("network down")
  })

  it("opens the new task dialog and creates a task", async () => {
    const user = userEvent.setup()
    listTodosMock.mockResolvedValue([])
    createTodoMock.mockResolvedValue(makeTodo({ asdlc_us117912_todoid: "new" }))
    renderHome()

    await waitFor(() => expect(screen.getByTestId("todo-empty-state")).toBeInTheDocument())

    await user.click(screen.getByTestId("new-todo-button"))
    const dialog = screen.getByTestId("todo-form-dialog")
    await user.type(within(dialog).getByTestId("todo-title-input"), "Write report")
    await user.click(within(dialog).getByTestId("todo-submit"))

    await waitFor(() => expect(createTodoMock).toHaveBeenCalled())
    expect(createTodoMock.mock.calls[0][0]).toMatchObject({
      asdlc_us117912_title: "Write report",
    })
  })

  it("shows an inline error when submitting without a title", async () => {
    const user = userEvent.setup()
    listTodosMock.mockResolvedValue([])
    renderHome()

    await waitFor(() => expect(screen.getByTestId("todo-empty-state")).toBeInTheDocument())

    await user.click(screen.getByTestId("new-todo-button"))
    const dialog = screen.getByTestId("todo-form-dialog")
    await user.click(within(dialog).getByTestId("todo-submit"))

    expect(within(dialog).getByTestId("todo-title-error")).toBeInTheDocument()
    expect(createTodoMock).not.toHaveBeenCalled()
  })

  it("toggles a todo's completed state via the checkbox", async () => {
    const user = userEvent.setup()
    listTodosMock.mockResolvedValue([makeTodo()])
    toggleTodoCompletedMock.mockResolvedValue(makeTodo({ asdlc_us117912_iscompleted: true }))
    renderHome()

    await waitFor(() => expect(screen.getAllByTestId("todo-row")).toHaveLength(1))
    await user.click(screen.getByTestId("todo-row-checkbox"))

    await waitFor(() =>
      expect(toggleTodoCompletedMock).toHaveBeenCalledWith("1", true),
    )
  })

  it("deletes a todo after confirming", async () => {
    const user = userEvent.setup()
    listTodosMock.mockResolvedValue([makeTodo()])
    removeTodoMock.mockResolvedValue(undefined)
    renderHome()

    await waitFor(() => expect(screen.getAllByTestId("todo-row")).toHaveLength(1))
    await user.click(screen.getByTestId("todo-delete-button"))

    const confirmDialog = screen.getByTestId("todo-delete-dialog")
    await user.click(within(confirmDialog).getByTestId("todo-delete-confirm"))

    await waitFor(() => expect(removeTodoMock).toHaveBeenCalledWith("1"))
  })
})
