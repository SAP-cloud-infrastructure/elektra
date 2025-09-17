// The problem is that setupFiles runs before each test file but doesn’t extend Jest matchers like toBeInTheDocument.
import "@testing-library/jest-dom"

// 3. Polyfill Response for Node environment (needed by TanStack Router)
globalThis.Response =
  globalThis.Response ||
  class {
    constructor(body, init) {
      this.body = body
      this.status = init?.status ?? 200
      this.statusText = init?.statusText ?? "OK"
      this.headers = init?.headers ?? {}
    }
  }

// Optional: Polyfill Request and Headers if needed
globalThis.Request =
  globalThis.Request ||
  class {
    constructor(input, init) {
      this.input = input
      this.init = init
    }
  }
globalThis.Headers =
  globalThis.Headers ||
  class {
    constructor(headers) {
      this.headers = headers
    }
  }
