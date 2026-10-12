import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount anything rendered by a test before the next one runs.
afterEach(() => {
  cleanup()
})

// jsdom does not implement these browser APIs. Radix UI primitives (Dialog,
// Select, Popover, DropdownMenu, Tooltip, AlertDialog, …) call them during
// mount/interaction, so ANY test that renders or opens one of these
// components fails/throws without the stubs below — even if the component
// itself has nothing to do with layout or pointer devices.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver
}

for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, {
      value: () => false,
      writable: true,
    })
  }
}

if (!("scrollIntoView" in Element.prototype)) {
  ;(Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {}
}
