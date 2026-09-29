import React from "react"
import { render, screen, act, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import "@testing-library/jest-dom"
import HeadingInfo from "./HeadingInfo"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { defaultMockClient } from "../../../mocks/TestTools"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { deferredPromise } from "../../../mocks/TestTools"

const TestWrapper =
  (queryClient: QueryClient, apiClient = defaultMockClient) =>
  ({ children }: { children: React.ReactNode }) => {
    const rootRoute = createRootRoute({
      component: () => children,
    })

    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => null,
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
      context: { apiClient, region: "test-region", projectid: "test-project" },
    })

    return (
      <PortalProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </PortalProvider>
    )
  }

describe("HeadingInfo", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders with collapsed instructions by default", async () => {
    const wrapper = TestWrapper(queryClient)
    render(<HeadingInfo />, { wrapper })

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /show kubectl setup instructions/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute("aria-expanded", "false")
    })
  })

  it("shows instructions when button is clicked", async () => {
    const wrapper = TestWrapper(queryClient)
    render(<HeadingInfo />, { wrapper })

    const button = await screen.findByRole("button", { name: /show kubectl setup instructions/i })

    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(button).toHaveAttribute("aria-expanded", "true")
      expect(screen.getByText(/hide kubectl setup instructions/i)).toBeInTheDocument()
    })
  })

  it("shows loading state while fetching instructions", async () => {
    const instructionsDeferred = deferredPromise<string>()
    const mockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        getScikubeInstructions: vi.fn().mockReturnValue(instructionsDeferred.promise),
      },
    }

    const wrapper = TestWrapper(queryClient, mockClient)
    render(<HeadingInfo />, { wrapper })

    const button = await screen.findByRole("button", { name: /show kubectl setup instructions/i })

    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByText(/loading instructions/i)).toBeInTheDocument()
    })

    // Resolve the promise to cleanup
    instructionsDeferred.resolve("Test instructions")
  })

  it("shows error state when fetching instructions fails", async () => {
    const mockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        getScikubeInstructions: vi.fn().mockRejectedValue(new Error("Failed to fetch")),
      },
    }

    const wrapper = TestWrapper(queryClient, mockClient)
    render(<HeadingInfo />, { wrapper })

    const button = await screen.findByRole("button", { name: /show kubectl setup instructions/i })

    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
    })
  })
})
