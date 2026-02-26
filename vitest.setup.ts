import { expect } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { vi } from "vitest"

// Manually extend expect with jest-dom matchers
expect.extend(matchers)

// Mock jQuery
const jqueryMock = vi.fn(() => ({
  popover: vi.fn(),
  tooltip: vi.fn(),
  modal: vi.fn(),
  dropdown: vi.fn(),
  // Add other jQuery methods your code might use
}))

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

globalThis.$ = jqueryMock
globalThis.jQuery = jqueryMock
window.$ = jqueryMock
window.jQuery = jqueryMock
