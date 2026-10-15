import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type TodoDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  isDeleting: boolean
  onConfirm: () => void
}

export function TodoDeleteDialog({
  open,
  onOpenChange,
  title,
  isDeleting,
  onConfirm,
}: TodoDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="todo-delete-dialog">
        <DialogHeader>
          <DialogTitle>Delete task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{title}&rdquo;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="todo-delete-cancel"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="todo-delete-confirm"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
