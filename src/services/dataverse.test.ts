import { describe, it, expect, vi, beforeEach } from "vitest"

const getAllMock = vi.fn()
const getMock = vi.fn()
const createMock = vi.fn()
const updateMock = vi.fn()
const deleteMock = vi.fn()

vi.mock("@/generated", () => ({
  Asdlc_us117912_todosService: {
    getAll: (...args: unknown[]) => getAllMock(...args),
    get: (...args: unknown[]) => getMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}))

import {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  removeTodo,
  toggleTodoCompleted,
} from "./dataverse"

describe("dataverse service - todos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("listTodos returns data on success", async () => {
    const rows = [{ asdlc_us117912_todoid: "1", asdlc_us117912_title: "Buy milk" }]
    getAllMock.mockResolvedValue({ success: true, data: rows })

    const result = await listTodos()

    expect(result).toEqual(rows)
    expect(getAllMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: ["asdlc_us117912_duedate asc", "createdon asc"],
        top: 500,
      }),
    )
  })

  it("listTodos throws the operation error on failure", async () => {
    const error = new Error("boom")
    getAllMock.mockResolvedValue({ success: false, data: undefined, error })

    await expect(listTodos()).rejects.toThrow("boom")
  })

  it("listTodos throws a default error when none is provided", async () => {
    getAllMock.mockResolvedValue({ success: false, data: undefined })

    await expect(listTodos()).rejects.toThrow("Dataverse operation failed")
  })

  it("getTodo returns the row on success", async () => {
    const row = { asdlc_us117912_todoid: "1", asdlc_us117912_title: "Buy milk" }
    getMock.mockResolvedValue({ success: true, data: row })

    const result = await getTodo("1")

    expect(result).toEqual(row)
    expect(getMock).toHaveBeenCalledWith("1", expect.any(Object))
  })

  it("createTodo sends the new row and returns the created record", async () => {
    const created = { asdlc_us117912_todoid: "new-id", asdlc_us117912_title: "Task" }
    createMock.mockResolvedValue({ success: true, data: created })

    const result = await createTodo({
      asdlc_us117912_title: "Task",
      asdlc_us117912_duedate: "2024-01-01",
    })

    expect(result).toEqual(created)
    expect(createMock).toHaveBeenCalled()
  })

  it("updateTodo patches the given fields", async () => {
    const updated = { asdlc_us117912_todoid: "1", asdlc_us117912_title: "Updated" }
    updateMock.mockResolvedValue({ success: true, data: updated })

    const result = await updateTodo("1", { asdlc_us117912_title: "Updated" })

    expect(result).toEqual(updated)
    expect(updateMock).toHaveBeenCalledWith("1", { asdlc_us117912_title: "Updated" })
  })

  it("toggleTodoCompleted updates only the completed flag", async () => {
    updateMock.mockResolvedValue({ success: true, data: {} })

    await toggleTodoCompleted("1", true)

    expect(updateMock).toHaveBeenCalledWith("1", { asdlc_us117912_iscompleted: true })
  })

  it("removeTodo calls delete with the id", async () => {
    deleteMock.mockResolvedValue(undefined)

    await removeTodo("1")

    expect(deleteMock).toHaveBeenCalledWith("1")
  })
})
