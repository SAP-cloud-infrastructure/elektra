import { expect } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { vi } from "vitest"

// Manually extend expect with jest-dom matchers
expect.extend(matchers)

// Mock jQuery
global.$ = vi.fn(() => ({
  popover: vi.fn(),
  tooltip: vi.fn(),
  modal: vi.fn(),
  dropdown: vi.fn(),
  // Add other jQuery methods your code might use
}))

// Global mocks that apply to all tests
// ResizeObserver is needed for testing some JunoUI-Components like Select
global.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.jQuery = global.$
window.$ = global.$
window.jQuery = global.$
