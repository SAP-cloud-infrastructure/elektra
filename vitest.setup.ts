import { expect } from "vitest"
import * as matchers from "@testing-library/jest-dom/matchers"
import { vi } from "vitest"

// Manually extend expect with jest-dom matchers
expect.extend(matchers)

// Suppress uncaught error logs from intentional test errors
// These are expected when testing error handling and retry logic
const originalConsoleError = console.error
beforeEach(() => {
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || ""
    // Suppress stack traces from intentional test errors
    if (
      message.includes("HTTPError:") ||
      message.includes("NetworkError:") ||
      message.includes("Uncaught") ||
      message.includes("statusCode:")
    ) {
      return
    }
    originalConsoleError(...args)
  }
})

afterEach(() => {
  console.error = originalConsoleError
})

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
