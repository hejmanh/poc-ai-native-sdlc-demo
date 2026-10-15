import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { toDateKey } from "@/lib/todo-grouping"

type TodoDateFilterProps = {
  selectedDate: string | null
  onSelect: (date: string | null) => void
}

export function TodoDateFilter({ selectedDate, onSelect }: TodoDateFilterProps) {
  const selected = selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" data-testid="todo-date-filter">
            <CalendarIcon />
            {selectedDate ? `Filtered: ${selectedDate}` : "Filter by date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onSelect(date ? toDateKey(date) : null)}
          />
        </PopoverContent>
      </Popover>

      {selectedDate && (
        <Button
          type="button"
          variant="ghost"
          data-testid="todo-clear-filter"
          onClick={() => onSelect(null)}
        >
          Show all
        </Button>
      )}
    </div>
  )
}
