import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toDateKey } from "@/lib/todo-grouping"
import type { Todo } from "@/services/dataverse"

export type TodoFormValues = {
  title: string
  notes: string
  dueDate: string
}

type TodoFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  todo?: Todo | null
  isSubmitting: boolean
  onSubmit: (values: TodoFormValues) => void
}

function initialValues(todo?: Todo | null): TodoFormValues {
  if (todo) {
    return {
      title: todo.asdlc_us117912_title,
      notes: todo.asdlc_us117912_notes ?? "",
      dueDate: toDateKey(todo.asdlc_us117912_duedate),
    }
  }
  return {
    title: "",
    notes: "",
    dueDate: toDateKey(new Date()),
  }
}

export function TodoFormDialog({
  open,
  onOpenChange,
  mode,
  todo,
  isSubmitting,
  onSubmit,
}: TodoFormDialogProps) {
  const [values, setValues] = useState<TodoFormValues>(() => initialValues(todo))
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({})

  useEffect(() => {
    if (open) {
      setValues(initialValues(todo))
      setErrors({})
    }
  }, [open, todo])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: { title?: string; dueDate?: string } = {}
    if (!values.title.trim()) nextErrors.title = "Title is required."
    if (!values.dueDate.trim()) nextErrors.dueDate = "Due date is required."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="todo-form-dialog">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="todo-title-input">Title</Label>
              <Input
                id="todo-title-input"
                data-testid="todo-title-input"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && (
                <p className="text-destructive text-sm" data-testid="todo-title-error">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="todo-duedate-input">Due date</Label>
              <Input
                id="todo-duedate-input"
                data-testid="todo-duedate-input"
                type="date"
                value={values.dueDate}
                onChange={(e) => setValues((v) => ({ ...v, dueDate: e.target.value }))}
                aria-invalid={Boolean(errors.dueDate)}
              />
              {errors.dueDate && (
                <p className="text-destructive text-sm" data-testid="todo-duedate-error">
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="todo-notes-input">Notes</Label>
              <Textarea
                id="todo-notes-input"
                data-testid="todo-notes-input"
                value={values.notes}
                onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="todo-form-cancel"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="todo-submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
