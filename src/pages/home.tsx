import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useToggleTodoCompleted,
} from "@/hooks/use-todos"
import { TodoFormDialog, type TodoFormValues } from "@/components/todo/todo-form-dialog"
import { TodoDeleteDialog } from "@/components/todo/todo-delete-dialog"
import { TodoRow } from "@/components/todo/todo-row"
import { TodoDateFilter } from "@/components/todo/todo-date-filter"
import { TODO_GROUP_ORDER, groupTodos, toDateKey } from "@/lib/todo-grouping"
import type { Todo } from "@/services/dataverse"

export default function HomePage() {
  const { data: todos, isLoading, isError, error } = useTodos()
  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const toggleCompleted = useToggleTodoCompleted()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null)
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  const filteredTodos = useMemo(() => {
    if (!todos) return []
    if (!dateFilter) return todos
    return todos.filter((t) => toDateKey(t.asdlc_us117912_duedate) === dateFilter)
  }, [todos, dateFilter])

  const groups = useMemo(() => groupTodos(filteredTodos), [filteredTodos])

  function openCreateDialog() {
    setFormMode("create")
    setActiveTodo(null)
    setIsFormOpen(true)
  }

  function openEditDialog(todo: Todo) {
    setFormMode("edit")
    setActiveTodo(todo)
    setIsFormOpen(true)
  }

  function handleFormSubmit(values: TodoFormValues) {
    if (formMode === "create") {
      createTodo.mutate(
        {
          asdlc_us117912_title: values.title.trim(),
          asdlc_us117912_duedate: values.dueDate,
          asdlc_us117912_notes: values.notes.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Task added.")
            setIsFormOpen(false)
          },
          onError: (err) => {
            toast.error(`Could not add task: ${(err as Error).message}`)
          },
        },
      )
    } else if (activeTodo) {
      updateTodo.mutate(
        {
          id: activeTodo.asdlc_us117912_todoid,
          patch: {
            asdlc_us117912_title: values.title.trim(),
            asdlc_us117912_duedate: values.dueDate,
            asdlc_us117912_notes: values.notes.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Task updated.")
            setIsFormOpen(false)
          },
          onError: (err) => {
            toast.error(`Could not update task: ${(err as Error).message}`)
          },
        },
      )
    }
  }

  function handleToggleCompleted(todo: Todo, isCompleted: boolean) {
    toggleCompleted.mutate(
      { id: todo.asdlc_us117912_todoid, isCompleted },
      {
        onError: (err) => {
          toast.error(`Could not update task: ${(err as Error).message}`)
        },
      },
    )
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteTodo.mutate(deleteTarget.asdlc_us117912_todoid, {
      onSuccess: () => {
        toast.success("Task deleted.")
        setDeleteTarget(null)
      },
      onError: (err) => {
        toast.error(`Could not delete task: ${(err as Error).message}`)
      },
    })
  }

  const isSubmitting = createTodo.isPending || updateTodo.isPending
  const hasAnyTodos = (filteredTodos?.length ?? 0) > 0

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My To Do List</h1>
          <p className="text-muted-foreground text-sm">Keep track of tasks by date.</p>
        </div>
        <Button data-testid="new-todo-button" onClick={openCreateDialog}>
          <PlusIcon />
          New task
        </Button>
      </div>

      <TodoDateFilter selectedDate={dateFilter} onSelect={setDateFilter} />

      {isLoading && (
        <div className="flex flex-col gap-2" data-testid="todo-loading">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm" data-testid="todo-error">
          Could not load tasks: {(error as Error)?.message ?? "Unknown error"}
        </p>
      )}

      {!isLoading && !isError && (
        <div data-testid="todo-list" className="flex flex-col gap-6">
          {!hasAnyTodos && (
            <p className="text-muted-foreground text-sm" data-testid="todo-empty-state">
              {dateFilter
                ? "No tasks due on this date."
                : "No tasks yet. Click \"New task\" to add one."}
            </p>
          )}

          {hasAnyTodos &&
            TODO_GROUP_ORDER.map((groupName) => {
              const groupTodosList = groups[groupName]
              if (groupTodosList.length === 0) return null

              return (
                <div key={groupName} className="flex flex-col gap-2">
                  <h2
                    className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                    data-testid="todo-group-header"
                  >
                    {groupName}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {groupTodosList.map((todo) => (
                      <TodoRow
                        key={todo.asdlc_us117912_todoid}
                        todo={todo}
                        onToggleCompleted={(isCompleted) => handleToggleCompleted(todo, isCompleted)}
                        onEdit={() => openEditDialog(todo)}
                        onDelete={() => setDeleteTarget(todo)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <TodoFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        todo={activeTodo}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
      />

      <TodoDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget?.asdlc_us117912_title ?? ""}
        isDeleting={deleteTodo.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
