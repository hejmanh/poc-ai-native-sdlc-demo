import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount anything rendered by a test before the next one runs.
afterEach(() => {
  cleanup()
})
