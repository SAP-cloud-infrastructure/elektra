// React 19 removed ReactDOM.findDOMNode; reattach it for legacy libraries
// (react-bootstrap@0.33 / react-overlays@0.9.3). Must run before any render.
import "./app/javascript/lib/react19-finddomnode-shim.js"
import { expect } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { vi } from "vitest"

// Manually extend expect with jest-dom matchers
expect.extend(matchers)

// Mock jQuery
type JQueryMock = ReturnType<typeof vi.fn> & { fn: Record<string, unknown> }
const jqueryMock = vi.fn(() => ({
  popover: vi.fn(),
  tooltip: vi.fn(),
  modal: vi.fn(),
  dropdown: vi.fn(),
  // Add other jQuery methods your code might use
})) as unknown as JQueryMock

// Bootstrap 5 ships an optional jQuery integration: on DOMContentLoaded its
// `defineJQueryPlugin` does `$.fn[name] = ...`. Because our mock sets
// `window.jQuery`, BS5's `getjQuery()` returns the mock and then crashes on the
// missing `.fn` (`Cannot read properties of undefined (reading 'alert')`),
// taking down every test file that transitively imports `bootstrap`.
// Give the mock an `fn` bag so the plugin registration is a harmless no-op.
jqueryMock.fn = {}

// Belt-and-suspenders: tell BS5 to skip its jQuery integration entirely (the
// mitigation documented in the BS5 migration spike). `defineJQueryPlugin`
// fires on DOMContentLoaded during `import "bootstrap"`, so the attribute must
// be set here (setup runs before any test file's imports).
if (typeof document !== "undefined" && document.body) {
  document.body.setAttribute("data-bs-no-jquery", "")
}

declare global {
  var $: typeof jqueryMock
  var jQuery: typeof jqueryMock
  interface Window {
    $: typeof jqueryMock
    jQuery: typeof jqueryMock
  }
}

// Global mocks that apply to all tests
// ResizeObserver is needed for testing some JunoUI-Components like Select
global.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Mock DOM Range API for CodeMirror
if (typeof document !== "undefined") {
  // Mock createRange for CodeMirror
  document.createRange = () => {
    const range = new Range()

    range.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => {},
    }))

    range.getClientRects = vi.fn(() => ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    }))

    return range
  }

  // Mock getBoundingClientRect for all elements
  if (!Element.prototype.getBoundingClientRect) {
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => {},
    }))
  }
}

globalThis.$ = jqueryMock
globalThis.jQuery = jqueryMock
window.$ = jqueryMock
window.jQuery = jqueryMock
