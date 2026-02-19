import * as React from "react"
import { renderHook, render, screen } from "@testing-library/react"
import { act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import StoreProvider, {
  useAuth,
  useAuthData,
  useAuthProject,
  useAuthActions,
  useGlobalsUrlStateKey,
  useGlobalsEndpoint,
  useGlobalsEmbedded,
  useGlobalsActions,
} from "./StoreProvider"

describe("StoreProvider", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>

  describe("Component Rendering", () => {
    it("renders children correctly", () => {
      render(
        <StoreProvider>
          <div data-testid="test-child">Test Child</div>
        </StoreProvider>
      )

      expect(screen.getByTestId("test-child")).toBeInTheDocument()
      expect(screen.getByText("Test Child")).toBeInTheDocument()
    })

    it("renders multiple children correctly", () => {
      render(
        <StoreProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </StoreProvider>
      )

      expect(screen.getByTestId("child-1")).toBeInTheDocument()
      expect(screen.getByTestId("child-2")).toBeInTheDocument()
      expect(screen.getByTestId("child-3")).toBeInTheDocument()
    })

    it("renders nested components correctly", () => {
      render(
        <StoreProvider>
          <div data-testid="parent">
            <div data-testid="child">
              <div data-testid="grandchild">Nested Content</div>
            </div>
          </div>
        </StoreProvider>
      )

      expect(screen.getByTestId("parent")).toBeInTheDocument()
      expect(screen.getByTestId("child")).toBeInTheDocument()
      expect(screen.getByTestId("grandchild")).toBeInTheDocument()
    })
  })

  describe("useAppStore Error Handling", () => {
    it("throws error when used outside StoreProvider", () => {
      // We expect this to throw, so we need to suppress console.error during the test
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useAuthData when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useAuthData())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useAuthProject when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useAuthProject())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useAuthActions when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useAuthActions())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useGlobalsUrlStateKey when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useGlobalsUrlStateKey())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useGlobalsEndpoint when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useGlobalsEndpoint())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useGlobalsEmbedded when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useGlobalsEmbedded())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })

    it("throws error for useGlobalsActions when used outside StoreProvider", () => {
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useGlobalsActions())
      }).toThrow("useAppStore must be used within StoreProvider")

      console.error = originalError
    })
  })

  describe("Auth Hooks - useAuth", () => {
    it("returns complete auth object with initial state", () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current).toHaveProperty("token")
      expect(result.current).toHaveProperty("project")
      expect(result.current).toHaveProperty("actions")
      expect(result.current.token).toBe(null)
      expect(result.current.project).toBe(null)
      expect(result.current.actions).toHaveProperty("setAuthData")
    })

    it("returns updated auth object after setAuthData is called", () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.actions.setAuthData({ token: "test-token", project: "test-project" })
      })

      expect(result.current.token).toBe("test-token")
      expect(result.current.project).toBe("test-project")
    })
  })

  describe("Auth Hooks - useAuthData", () => {
    it("returns null as initial token value", () => {
      const { result } = renderHook(() => useAuthData(), { wrapper })
      expect(result.current).toBe(null)
    })

    it("returns updated token after setAuthData is called", () => {
      const { result } = renderHook(
        () => ({
          authData: useAuthData(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "new-token", project: "project-1" })
      })

      expect(result.current.authData).toBe("new-token")
    })

    it("updates token multiple times", () => {
      const { result } = renderHook(
        () => ({
          authData: useAuthData(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "project-1" })
      })
      expect(result.current.authData).toBe("token-1")

      act(() => {
        result.current.authActions.setAuthData({ token: "token-2", project: "project-1" })
      })
      expect(result.current.authData).toBe("token-2")

      act(() => {
        result.current.authActions.setAuthData({ token: "token-3", project: "project-1" })
      })
      expect(result.current.authData).toBe("token-3")
    })
  })

  describe("Auth Hooks - useAuthProject", () => {
    it("returns null as initial project value", () => {
      const { result } = renderHook(() => useAuthProject(), { wrapper })
      expect(result.current).toBe(null)
    })

    it("returns updated project after setAuthData is called", () => {
      const { result } = renderHook(
        () => ({
          authProject: useAuthProject(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "my-project" })
      })

      expect(result.current.authProject).toBe("my-project")
    })

    it("updates project multiple times", () => {
      const { result } = renderHook(
        () => ({
          authProject: useAuthProject(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "project-a" })
      })
      expect(result.current.authProject).toBe("project-a")

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "project-b" })
      })
      expect(result.current.authProject).toBe("project-b")

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "project-c" })
      })
      expect(result.current.authProject).toBe("project-c")
    })
  })

  describe("Auth Hooks - useAuthActions", () => {
    it("returns actions object with setAuthData method", () => {
      const { result } = renderHook(() => useAuthActions(), { wrapper })

      expect(result.current).toHaveProperty("setAuthData")
      expect(typeof result.current.setAuthData).toBe("function")
    })

    it("setAuthData updates both token and project", () => {
      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "auth-token", project: "auth-project" })
      })

      expect(result.current.auth.token).toBe("auth-token")
      expect(result.current.auth.project).toBe("auth-project")
    })

    it("setAuthData handles null data gracefully", () => {
      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      // Set initial values
      act(() => {
        result.current.authActions.setAuthData({ token: "initial-token", project: "initial-project" })
      })
      expect(result.current.auth.token).toBe("initial-token")

      // Try to set null (should not update based on CreateAuthDataSlice implementation)
      act(() => {
        result.current.authActions.setAuthData(null)
      })
      expect(result.current.auth.token).toBe("initial-token")
      expect(result.current.auth.project).toBe("initial-project")
    })

    it("setAuthData does not update if data has not changed", () => {
      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "same-token", project: "same-project" })
      })

      const firstAuth = result.current.auth

      // Call setAuthData with same values
      act(() => {
        result.current.authActions.setAuthData({ token: "same-token", project: "same-project" })
      })

      // Values should remain the same
      expect(result.current.auth.token).toBe("same-token")
      expect(result.current.auth.project).toBe("same-project")
    })
  })

  describe("Globals Hooks - useGlobalsUrlStateKey", () => {
    it("returns empty string as initial value", () => {
      const { result } = renderHook(() => useGlobalsUrlStateKey(), { wrapper })
      expect(result.current).toBe("")
    })

    it("returns updated urlStateKey after setUrlStateKey is called", () => {
      const { result } = renderHook(
        () => ({
          urlStateKey: useGlobalsUrlStateKey(),
          globalsActions: useGlobalsActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setUrlStateKey("maillog")
      })

      expect(result.current.urlStateKey).toBe("maillog")
    })
  })

  describe("Globals Hooks - useGlobalsEndpoint", () => {
    it("returns null as initial value", () => {
      const { result } = renderHook(() => useGlobalsEndpoint(), { wrapper })
      expect(result.current).toBe(null)
    })

    it("returns updated endpoint after setEndpoint is called", () => {
      const { result } = renderHook(
        () => ({
          endpoint: useGlobalsEndpoint(),
          globalsActions: useGlobalsActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setEndpoint("https://api.example.com")
      })

      expect(result.current.endpoint).toBe("https://api.example.com")
    })
  })

  describe("Globals Hooks - useGlobalsEmbedded", () => {
    it("returns false as initial value", () => {
      const { result } = renderHook(() => useGlobalsEmbedded(), { wrapper })
      expect(result.current).toBe(false)
    })

    it("returns updated embedded value after setEmbedded is called", () => {
      const { result } = renderHook(
        () => ({
          embedded: useGlobalsEmbedded(),
          globalsActions: useGlobalsActions(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.globalsActions.setEmbedded(true)
      })

      expect(result.current.embedded).toBe(true)
    })
  })

  describe("Globals Hooks - useGlobalsActions", () => {
    it("returns actions object with all required methods", () => {
      const { result } = renderHook(() => useGlobalsActions(), { wrapper })

      expect(result.current).toHaveProperty("setUrlStateKey")
      expect(result.current).toHaveProperty("setEndpoint")
      expect(result.current).toHaveProperty("setEmbedded")
      expect(typeof result.current.setUrlStateKey).toBe("function")
      expect(typeof result.current.setEndpoint).toBe("function")
      expect(typeof result.current.setEmbedded).toBe("function")
    })
  })

  describe("Combined Auth and Globals State", () => {
    it("updates auth and globals independently", () => {
      const { result } = renderHook(
        () => ({
          auth: useAuth(),
          authActions: useAuthActions(),
          urlStateKey: useGlobalsUrlStateKey(),
          endpoint: useGlobalsEndpoint(),
          embedded: useGlobalsEmbedded(),
          globalsActions: useGlobalsActions(),
        }),
        { wrapper }
      )

      // Update auth
      act(() => {
        result.current.authActions.setAuthData({ token: "test-token", project: "test-project" })
      })
      expect(result.current.auth.token).toBe("test-token")
      expect(result.current.auth.project).toBe("test-project")
      expect(result.current.urlStateKey).toBe("")
      expect(result.current.endpoint).toBe(null)
      expect(result.current.embedded).toBe(false)

      // Update globals
      act(() => {
        result.current.globalsActions.setUrlStateKey("maillog")
        result.current.globalsActions.setEndpoint("https://api.example.com")
        result.current.globalsActions.setEmbedded(true)
      })
      expect(result.current.auth.token).toBe("test-token")
      expect(result.current.auth.project).toBe("test-project")
      expect(result.current.urlStateKey).toBe("maillog")
      expect(result.current.endpoint).toBe("https://api.example.com")
      expect(result.current.embedded).toBe(true)
    })

    it("multiple hooks within same render share the same store", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          authData: useAuthData(),
          authProject: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "shared-token", project: "shared-project" })
      })

      expect(result.current.authData).toBe("shared-token")
      expect(result.current.authProject).toBe("shared-project")
    })
  })

  describe("Store Isolation", () => {
    it("each StoreProvider creates an isolated store", () => {
      const wrapper1 = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>
      const wrapper2 = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>

      const { result: result1 } = renderHook(
        () => ({
          authActions: useAuthActions(),
          authData: useAuthData(),
        }),
        { wrapper: wrapper1 }
      )

      const { result: result2 } = renderHook(
        () => ({
          authActions: useAuthActions(),
          authData: useAuthData(),
        }),
        { wrapper: wrapper2 }
      )

      // Update first store
      act(() => {
        result1.current.authActions.setAuthData({ token: "token-1", project: "project-1" })
      })

      // Update second store
      act(() => {
        result2.current.authActions.setAuthData({ token: "token-2", project: "project-2" })
      })

      // Each store should have its own isolated state
      expect(result1.current.authData).toBe("token-1")
      expect(result2.current.authData).toBe("token-2")
    })
  })

  describe("Complex State Updates", () => {
    it("handles rapid successive updates correctly", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          authData: useAuthData(),
          globalsActions: useGlobalsActions(),
          urlStateKey: useGlobalsUrlStateKey(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "project-1" })
        result.current.authActions.setAuthData({ token: "token-2", project: "project-2" })
        result.current.authActions.setAuthData({ token: "token-3", project: "project-3" })
        result.current.globalsActions.setUrlStateKey("key-1")
        result.current.globalsActions.setUrlStateKey("key-2")
        result.current.globalsActions.setUrlStateKey("key-3")
      })

      expect(result.current.authData).toBe("token-3")
      expect(result.current.urlStateKey).toBe("key-3")
    })

    it("handles interleaved auth and globals updates", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          auth: useAuth(),
          globalsActions: useGlobalsActions(),
          endpoint: useGlobalsEndpoint(),
          embedded: useGlobalsEmbedded(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({ token: "token-1", project: "project-1" })
        result.current.globalsActions.setEndpoint("https://api1.example.com")
        result.current.authActions.setAuthData({ token: "token-2", project: "project-2" })
        result.current.globalsActions.setEmbedded(true)
        result.current.authActions.setAuthData({ token: "token-3", project: "project-3" })
      })

      expect(result.current.auth.token).toBe("token-3")
      expect(result.current.auth.project).toBe("project-3")
      expect(result.current.endpoint).toBe("https://api1.example.com")
      expect(result.current.embedded).toBe(true)
    })
  })

  describe("Hook Selector Performance", () => {
    it("selectors return specific parts of state", () => {
      const { result } = renderHook(
        () => ({
          authData: useAuthData(),
          authProject: useAuthProject(),
          authActions: useAuthActions(),
        }),
        { wrapper }
      )

      // authData should only return token (string or null), not the whole auth object
      expect(result.current.authData).toBe(null)

      // authProject should only return project (string or null), not the whole auth object
      expect(result.current.authProject).toBe(null)

      // authActions should only return actions
      expect(result.current.authActions).toHaveProperty("setAuthData")
      expect(result.current.authActions).not.toHaveProperty("token")
      expect(result.current.authActions).not.toHaveProperty("project")

      // After setting auth data, verify selectors return strings, not objects
      act(() => {
        result.current.authActions.setAuthData({ token: "test-token", project: "test-project" })
      })

      expect(typeof result.current.authData).toBe("string")
      expect(typeof result.current.authProject).toBe("string")
      expect(result.current.authData).toBe("test-token")
      expect(result.current.authProject).toBe("test-project")
    })

    it("globals selectors return specific parts of state", () => {
      const { result } = renderHook(
        () => ({
          urlStateKey: useGlobalsUrlStateKey(),
          endpoint: useGlobalsEndpoint(),
          embedded: useGlobalsEmbedded(),
          globalsActions: useGlobalsActions(),
        }),
        { wrapper }
      )

      // Each selector returns only its specific value
      expect(typeof result.current.urlStateKey).toBe("string")
      expect(result.current.endpoint).toBe(null)
      expect(typeof result.current.embedded).toBe("boolean")
      expect(typeof result.current.globalsActions).toBe("object")

      // globalsActions should only return actions, not state values
      expect(result.current.globalsActions).toHaveProperty("setUrlStateKey")
      expect(result.current.globalsActions).toHaveProperty("setEndpoint")
      expect(result.current.globalsActions).toHaveProperty("setEmbedded")
      expect(result.current.globalsActions).not.toHaveProperty("urlStateKey")
      expect(result.current.globalsActions).not.toHaveProperty("endpoint")
      expect(result.current.globalsActions).not.toHaveProperty("embedded")
    })
  })
})
