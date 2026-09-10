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

// Visual/canvas libraries (React Flow, react-konva, dnd-kit, charting
// libs, ...) commonly gate their own rendering on `ResizeObserver` actually
// reporting a real, non-zero measured size for a node before they compute
// layout/paths/portal content — reading a non-zero getBoundingClientRect is
// not enough by itself, since these libraries track "measured" width/height
// from the observer ENTRY, not from re-querying the DOM. The Radix stub
// above never invoked its callback at all (Radix doesn't read sizes back),
// so under it these libraries' nodes never left "unmeasured" and silently
// rendered nothing beyond their outermost container — no matter how the
// component code was changed, since the library simply never mounted its
// internal content (edges, canvas layers, portal-rendered labels, ...).
//
// The callback MUST be deferred (queueMicrotask), never fired synchronously
// inside observe(): a real browser's ResizeObserver callback is never
// synchronous either, and firing it synchronously — typically from inside a
// layout effect during React's commit phase — corrupts React's render cycle
// ("AggregateError" out of `act()`), breaking components that don't even
// use the library that needed this in the first place.
//
// Even with this, some libraries' internal timing is too library-specific
// to fully replicate with a generic polyfill (their own async layout passes,
// portals, etc.). If a test still can't reliably find something the
// component's source clearly renders, don't fight the library further —
// render that same information a second time as a plain, always-mounted,
// `sr-only` element outside the library's own render tree (see the Dev
// Agent's system prompt, "if a test keeps failing to find an element...").
if (!("ResizeObserver" in window) || !("__reactFlowSizeStubbed" in Element.prototype)) {
  class ResizeObserverStub {
    private readonly callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe(target: Element) {
      queueMicrotask(() => {
        const rect = target.getBoundingClientRect()
        this.callback(
          [{ target, contentRect: rect } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
      })
    }
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

// @xyflow/react needs getBoundingClientRect/offsetWidth/offsetHeight to
// report a real, non-zero size — jsdom's default of 0 for all three is what
// the ResizeObserver stub above reports back to React Flow otherwise.
if (!("__reactFlowSizeStubbed" in Element.prototype)) {
  Element.prototype.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 120,
    height: 40,
    top: 0,
    left: 0,
    right: 120,
    bottom: 40,
    toJSON() {
      return this
    },
  })
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 120 })
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 40 })
  Object.defineProperty(Element.prototype, "__reactFlowSizeStubbed", { value: true })
}
