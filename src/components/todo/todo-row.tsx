import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { PencilIcon, TrashIcon } from "lucide-react"
import type { Todo } from "@/services/dataverse"
import { toDateKey } from "@/lib/todo-grouping"

type TodoRowProps = {
  todo: Todo
  onToggleCompleted: (isCompleted: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function TodoRow({ todo, onToggleCompleted, onEdit, onDelete }: TodoRowProps) {
  const isCompleted = Boolean(todo.asdlc_us117912_iscompleted)

  return (
    <div
      data-testid="todo-row"
      className="flex items-center gap-3 rounded-md border px-3 py-2"
    >
      <Checkbox
        data-testid="todo-row-checkbox"
        checked={isCompleted}
        onCheckedChange={(checked) => onToggleCompleted(checked === true)}
        aria-label={`Mark "${todo.asdlc_us117912_title}" as ${isCompleted ? "not completed" : "completed"}`}
      />

      <button
        type="button"
        data-testid="todo-edit-button"
        onClick={onEdit}
        className="flex-1 text-left"
      >
        <p className={isCompleted ? "line-through text-muted-foreground" : ""}>
          {todo.asdlc_us117912_title}
        </p>
        <p className="text-xs text-muted-foreground">
          Due {toDateKey(todo.asdlc_us117912_duedate)}
        </p>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-testid="todo-edit-icon-button"
        aria-label="Edit task"
        onClick={onEdit}
      >
        <PencilIcon />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-testid="todo-delete-button"
        aria-label="Delete task"
        onClick={onDelete}
      >
        <TrashIcon />
      </Button>
    </div>
  )
}
