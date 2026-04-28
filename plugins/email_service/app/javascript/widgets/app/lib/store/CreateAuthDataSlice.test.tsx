import * as React from "react"
import { renderHook } from "@testing-library/react"
import { act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import StoreProvider, { useAuthActions, useAuthData, useAuthProject, useAuth } from "../../components/StoreProvider"

describe("createAuthDataSlice", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>

  describe("Initial State", () => {
    it("has default token as null", () => {
      const { result } = renderHook(() => useAuthData(), { wrapper })
      expect(result.current).toBe(null)
    })

    it("has default project as null", () => {
      const { result } = renderHook(() => useAuthProject(), { wrapper })
      expect(result.current).toBe(null)
    })

    it("has both token and project as null in auth object", () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.token).toBe(null)
      expect(result.current.project).toBe(null)
    })
  })

  describe("setAuthData", () => {
    it("updates both token and project when setAuthData is called", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "test-token-123",
          project: "test-project-456",
        })
      })

      expect(result.current.token).toBe("test-token-123")
      expect(result.current.project).toBe("test-project-456")
    })

    it("updates only token when project is null", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "new-token",
          project: null,
        })
      })

      expect(result.current.token).toBe("new-token")
      expect(result.current.project).toBe(null)
    })

    it("updates only project when token is null", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: null,
          project: "new-project",
        })
      })

      expect(result.current.token).toBe(null)
      expect(result.current.project).toBe("new-project")
    })

    it("does nothing when data is null", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      // Set initial values
      act(() => {
        result.current.authActions.setAuthData({
          token: "initial-token",
          project: "initial-project",
        })
      })

      expect(result.current.token).toBe("initial-token")
      expect(result.current.project).toBe("initial-project")

      // Try to set null
      act(() => {
        result.current.authActions.setAuthData(null)
      })

      // Values should remain unchanged
      expect(result.current.token).toBe("initial-token")
      expect(result.current.project).toBe("initial-project")
    })

    it("does not update state when data has not changed", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          auth: useAuth(),
        }),
        { wrapper }
      )

      // Set initial values
      act(() => {
        result.current.authActions.setAuthData({
          token: "same-token",
          project: "same-project",
        })
      })

      const initialAuth = result.current.auth

      // Try to set the same values
      act(() => {
        result.current.authActions.setAuthData({
          token: "same-token",
          project: "same-project",
        })
      })

      // Auth object should remain the same (state didn't change)
      expect(result.current.auth.token).toBe("same-token")
      expect(result.current.auth.project).toBe("same-project")
    })

    it("updates token multiple times", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "first-token",
          project: "project-1",
        })
      })
      expect(result.current.token).toBe("first-token")

      act(() => {
        result.current.authActions.setAuthData({
          token: "second-token",
          project: "project-1",
        })
      })
      expect(result.current.token).toBe("second-token")

      act(() => {
        result.current.authActions.setAuthData({
          token: "third-token",
          project: "project-1",
        })
      })
      expect(result.current.token).toBe("third-token")
    })

    it("updates project multiple times", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "first-project",
        })
      })
      expect(result.current.project).toBe("first-project")

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "second-project",
        })
      })
      expect(result.current.project).toBe("second-project")

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "third-project",
        })
      })
      expect(result.current.project).toBe("third-project")
    })

    it("updates both token and project when either changes", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      // Set initial values
      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "project-1",
        })
      })
      expect(result.current.token).toBe("token-1")
      expect(result.current.project).toBe("project-1")

      // Change only token
      act(() => {
        result.current.authActions.setAuthData({
          token: "token-2",
          project: "project-1",
        })
      })
      expect(result.current.token).toBe("token-2")
      expect(result.current.project).toBe("project-1")

      // Change only project
      act(() => {
        result.current.authActions.setAuthData({
          token: "token-2",
          project: "project-2",
        })
      })
      expect(result.current.token).toBe("token-2")
      expect(result.current.project).toBe("project-2")

      // Change both
      act(() => {
        result.current.authActions.setAuthData({
          token: "token-3",
          project: "project-3",
        })
      })
      expect(result.current.token).toBe("token-3")
      expect(result.current.project).toBe("project-3")
    })
  })

  describe("State Isolation", () => {
    it("multiple selectors within same render share the same store", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
          auth: useAuth(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "shared-token",
          project: "shared-project",
        })
      })

      // All selectors should see the updated values
      expect(result.current.token).toBe("shared-token")
      expect(result.current.project).toBe("shared-project")
      expect(result.current.auth.token).toBe("shared-token")
      expect(result.current.auth.project).toBe("shared-project")
    })
  })

  describe("Edge Cases", () => {
    it("handles empty string token", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "",
          project: "project-1",
        })
      })

      expect(result.current.token).toBe("")
    })

    it("handles empty string project", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "",
        })
      })

      expect(result.current.project).toBe("")
    })

    it("handles very long token strings", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
        }),
        { wrapper }
      )

      const longToken = "a".repeat(10000)

      act(() => {
        result.current.authActions.setAuthData({
          token: longToken,
          project: "project-1",
        })
      })

      expect(result.current.token).toBe(longToken)
      expect(result.current.token?.length).toBe(10000)
    })

    it("handles special characters in token and project", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "token!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
          project: "project!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
        })
      })

      expect(result.current.token).toBe("token!@#$%^&*()_+-=[]{}|;:',.<>?/~`")
      expect(result.current.project).toBe("project!@#$%^&*()_+-=[]{}|;:',.<>?/~`")
    })
  })

  describe("Optimization", () => {
    it("skips state update when both token and project are unchanged", () => {
      const { result, rerender } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      // Set initial values
      act(() => {
        result.current.authActions.setAuthData({
          token: "unchanged-token",
          project: "unchanged-project",
        })
      })

      const renderCount = { count: 0 }
      const { result: counterResult } = renderHook(
        () => {
          renderCount.count++
          return useAuthData()
        },
        { wrapper }
      )

      const initialRenderCount = renderCount.count

      // Try to set the same values
      act(() => {
        result.current.authActions.setAuthData({
          token: "unchanged-token",
          project: "unchanged-project",
        })
      })

      // Render count should not increase (optimization worked)
      expect(renderCount.count).toBe(initialRenderCount)
    })

    it("updates state when only token changes", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "project-1",
        })
      })

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-2",
          project: "project-1",
        })
      })

      expect(result.current.token).toBe("token-2")
      expect(result.current.project).toBe("project-1")
    })

    it("updates state when only project changes", () => {
      const { result } = renderHook(
        () => ({
          authActions: useAuthActions(),
          token: useAuthData(),
          project: useAuthProject(),
        }),
        { wrapper }
      )

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "project-1",
        })
      })

      act(() => {
        result.current.authActions.setAuthData({
          token: "token-1",
          project: "project-2",
        })
      })

      expect(result.current.token).toBe("token-1")
      expect(result.current.project).toBe("project-2")
    })
  })
})
