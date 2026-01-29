import * as React from "react"
import { renderHook } from "@testing-library/react"
import { act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import StoreProvider, {
  useGlobalsActions,
  useGlobalsUrlStateKey,
  useGlobalsEndpoint,
  useGlobalsEmbedded,
} from "../../components/StoreProvider"

describe("createGlobalsSlice", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>

  describe("Initial State", () => {
    it("has default embedded value as false", () => {
      const { result } = renderHook(() => useGlobalsEmbedded(), { wrapper })
      expect(result.current).toBe(false)
    })

    it("has default urlStateKey as empty string", () => {
      const { result } = renderHook(() => useGlobalsUrlStateKey(), { wrapper })
      expect(result.current).toBe("")
    })

    it("has default endpoint as null", () => {
      const { result } = renderHook(() => useGlobalsEndpoint(), { wrapper })
      expect(result.current).toBe(null)
    })
  })

  describe("setUrlStateKey", () => {
    it("updates urlStateKey when setUrlStateKey is called", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("example app")
      })

      expect(result.current.urlStateKey).toBe("example app")
    })

    it("updates urlStateKey multiple times", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("first value")
      })
      expect(result.current.urlStateKey).toBe("first value")

      act(() => {
        result.current.globalsActions.setUrlStateKey("second value")
      })
      expect(result.current.urlStateKey).toBe("second value")

      act(() => {
        result.current.globalsActions.setUrlStateKey("third value")
      })
      expect(result.current.urlStateKey).toBe("third value")
    })

    it("accepts empty string as urlStateKey", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("maillog")
      })
      expect(result.current.urlStateKey).toBe("maillog")

      act(() => {
        result.current.globalsActions.setUrlStateKey("")
      })
      expect(result.current.urlStateKey).toBe("")
    })
  })

  describe("setEndpoint", () => {
    it("updates endpoint when setEndpoint is called", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          endpoint: useGlobalsEndpoint(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setEndpoint("https://api.example.com")
      })

      expect(result.current.endpoint).toBe("https://api.example.com")
    })

    it("updates endpoint multiple times", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          endpoint: useGlobalsEndpoint(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setEndpoint("https://api1.example.com")
      })
      expect(result.current.endpoint).toBe("https://api1.example.com")

      act(() => {
        result.current.globalsActions.setEndpoint("https://api2.example.com")
      })
      expect(result.current.endpoint).toBe("https://api2.example.com")
    })

    it("updates endpoint with different URL formats", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          endpoint: useGlobalsEndpoint(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setEndpoint("http://localhost:3000")
      })
      expect(result.current.endpoint).toBe("http://localhost:3000")

      act(() => {
        result.current.globalsActions.setEndpoint("https://api.production.com/v1")
      })
      expect(result.current.endpoint).toBe("https://api.production.com/v1")
    })
  })

  describe("setEmbedded", () => {
    it("updates embedded when setEmbedded is called with true", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      expect(result.current.embedded).toBe(false)

      act(() => {
        result.current.globalsActions.setEmbedded(true)
      })

      expect(result.current.embedded).toBe(true)
    })

    it("updates embedded when setEmbedded is called with false", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setEmbedded(true)
      })
      expect(result.current.embedded).toBe(true)

      act(() => {
        result.current.globalsActions.setEmbedded(false)
      })
      expect(result.current.embedded).toBe(false)
    })

    it("toggles embedded value multiple times", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      expect(result.current.embedded).toBe(false)

      act(() => {
        result.current.globalsActions.setEmbedded(true)
      })
      expect(result.current.embedded).toBe(true)

      act(() => {
        result.current.globalsActions.setEmbedded(false)
      })
      expect(result.current.embedded).toBe(false)

      act(() => {
        result.current.globalsActions.setEmbedded(true)
      })
      expect(result.current.embedded).toBe(true)
    })
  })

  describe("Multiple Actions", () => {
    it("updates multiple globals values independently", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
          endpoint: useGlobalsEndpoint(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("maillog")
      })
      expect(result.current.urlStateKey).toBe("maillog")
      expect(result.current.endpoint).toBe(null)
      expect(result.current.embedded).toBe(false)

      act(() => {
        result.current.globalsActions.setEndpoint("https://api.example.com")
      })
      expect(result.current.urlStateKey).toBe("maillog")
      expect(result.current.endpoint).toBe("https://api.example.com")
      expect(result.current.embedded).toBe(false)

      act(() => {
        result.current.globalsActions.setEmbedded(true)
      })
      expect(result.current.urlStateKey).toBe("maillog")
      expect(result.current.endpoint).toBe("https://api.example.com")
      expect(result.current.embedded).toBe(true)
    })

    it("updates all globals values in sequence", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
          endpoint: useGlobalsEndpoint(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("test-app")
        result.current.globalsActions.setEndpoint("https://test.com")
        result.current.globalsActions.setEmbedded(true)
      })

      expect(result.current.urlStateKey).toBe("test-app")
      expect(result.current.endpoint).toBe("https://test.com")
      expect(result.current.embedded).toBe(true)
    })
  })

  describe("State Isolation", () => {
    it("multiple selectors within same render share the same store", () => {
      const { result } = renderHook(
        () => ({
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
          endpoint: useGlobalsEndpoint(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("shared value")
        result.current.globalsActions.setEndpoint("https://shared.com")
        result.current.globalsActions.setEmbedded(true)
      })

      // All selectors should see the updated values
      expect(result.current.urlStateKey).toBe("shared value")
      expect(result.current.endpoint).toBe("https://shared.com")
      expect(result.current.embedded).toBe(true)
    })
  })
})
