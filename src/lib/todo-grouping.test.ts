import { describe, it, expect } from "vitest"
import { groupForDueDate, groupTodos, toDateKey } from "./todo-grouping"
import type { Todo } from "@/services/dataverse"

const TODAY = "2024-06-15"

function makeTodo(id: string, dueDate: string): Todo {
  return {
    asdlc_us117912_todoid: id,
    asdlc_us117912_title: `Task ${id}`,
    asdlc_us117912_duedate: dueDate,
    asdlc_us117912_iscompleted: false,
  } as Todo
}

describe("toDateKey", () => {
  it("formats an ISO date string to YYYY-MM-DD", () => {
    expect(toDateKey("2024-06-15T00:00:00Z")).toBe("2024-06-15")
  })
})

describe("groupForDueDate", () => {
  it("classifies a past date as Overdue", () => {
    expect(groupForDueDate("2024-06-10", TODAY)).toBe("Overdue")
  })

  it("classifies today's date as Today", () => {
    expect(groupForDueDate("2024-06-15", TODAY)).toBe("Today")
  })

  it("classifies tomorrow's date as Tomorrow", () => {
    expect(groupForDueDate("2024-06-16", TODAY)).toBe("Tomorrow")
  })

  it("classifies a later date as Upcoming", () => {
    expect(groupForDueDate("2024-06-20", TODAY)).toBe("Upcoming")
  })
})

describe("groupTodos", () => {
  it("buckets todos into the four groups", () => {
    const todos = [
      makeTodo("1", "2024-06-10"),
      makeTodo("2", "2024-06-15"),
      makeTodo("3", "2024-06-16"),
      makeTodo("4", "2024-06-25"),
    ]

    const groups = groupTodos(todos, TODAY)

    expect(groups.Overdue.map((t) => t.asdlc_us117912_todoid)).toEqual(["1"])
    expect(groups.Today.map((t) => t.asdlc_us117912_todoid)).toEqual(["2"])
    expect(groups.Tomorrow.map((t) => t.asdlc_us117912_todoid)).toEqual(["3"])
    expect(groups.Upcoming.map((t) => t.asdlc_us117912_todoid)).toEqual(["4"])
  })

  it("returns empty arrays for groups with no todos", () => {
    const groups = groupTodos([], TODAY)
    expect(groups.Overdue).toEqual([])
    expect(groups.Today).toEqual([])
    expect(groups.Tomorrow).toEqual([])
    expect(groups.Upcoming).toEqual([])
  })
})
