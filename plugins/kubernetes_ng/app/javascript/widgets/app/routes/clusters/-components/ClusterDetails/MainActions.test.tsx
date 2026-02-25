import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom"
import MainActions from "./MainActions"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../../../mocks/data"
import { MessagesProvider, Messages } from "@cloudoperators/juno-messages-provider"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { deferredPromise } from "../../../../mocks/TestTools"
import { Cluster } from "../../../../types/cluster"

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
global.URL.revokeObjectURL = vi.fn()

// Helper to render MainActions with QueryClientProvider and Router context
const renderMainActions = ({
  shootPermissions = permissionsAllTrue,
  kubeconfigPermissions = permissionsAllTrue,
  disabled = false,
  apiClient = defaultMockClient,
  clusterName = defaultCluster.name,
  isFetching = false,
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  // Create a mock router with context
  const rootRoute = createRootRoute({
    component: () => (
      <MainActions
        shootPermissions={shootPermissions}
        kubeconfigPermissions={kubeconfigPermissions}
        disabled={disabled}
      />
    ),
  })

  const clusterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/clusters/$clusterName",
    component: () => null,
    loader: () => ({ isFetching }),
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([clusterRoute]),
    history: createMemoryHistory({ initialEntries: [`/clusters/${clusterName}`] }),
    context: { apiClient },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MessagesProvider>
        <PortalProvider>
          <Messages />
          <RouterProvider router={router} />
        </PortalProvider>
      </MessagesProvider>
    </QueryClientProvider>
  )
}

describe("<MainActions />", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all three buttons", async () => {
    renderMainActions()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /kube config/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete cluster/i })).toBeInTheDocument()
  })

  it("disables all buttons when disabled prop is true", async () => {
    renderMainActions({ disabled: true })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /refresh/i })).toBeDisabled()
    })
    expect(screen.getByRole("button", { name: /refresh/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /kube config/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /delete cluster/i })).toBeDisabled()
  })

  it("disables Delete Cluster button when no delete permission", async () => {
    renderMainActions({ shootPermissions: { ...permissionsAllTrue, delete: false } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete cluster/i })).toBeDisabled()
    })
  })

  it("disables Kube Config button when no create permission", async () => {
    renderMainActions({ kubeconfigPermissions: { ...permissionsAllTrue, create: false } })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /kube config/i })).toBeDisabled()
    })
  })

  describe("Kubeconfig download", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    let clickMock: ReturnType<typeof vi.fn>
    let originalCreateElement: typeof document.createElement

    // Mocks browser download behavior in JSDOM: It suppresses console errors for cleaner test output,
    // defines missing JSDOM APIs (URL.createObjectURL / URL.revokeObjectURL), and intercepts anchor
    // creation to spy on click() while still returning real DOM elements so React can append them normally.
    beforeEach(() => {
      // Silence console.error during tests
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      clickMock = vi.fn()

      // Save original implementation
      originalCreateElement = document.createElement.bind(document)

      // JSDOM does not implement these
      Object.defineProperty(URL, "createObjectURL", {
        writable: true,
        value: vi.fn(() => "blob:mock-url"),
      })

      Object.defineProperty(URL, "revokeObjectURL", {
        writable: true,
        value: vi.fn(),
      })

      // Mock only what we need, but keep REAL DOM elements
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        const element = originalCreateElement(tagName)

        if (tagName === "a") {
          // Spy on click, but keep the real element
          element.click = clickMock as unknown as typeof element.click
        }

        return element
      })
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
      vi.restoreAllMocks()
    })

    it("shows error message when kubeconfig download fails", async () => {
      const kubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderMainActions({
          apiClient: {
            ...defaultMockClient,
            gardener: {
              ...defaultMockClient.gardener,
              getKubeconfig: () => kubeconfigDeferred.promise,
            },
          },
        })
      )

      const downloadButton = await screen.findByRole("button", { name: /Kube Config/i })
      expect(downloadButton).toBeInTheDocument()

      // // Mock the API call to fail
      const errorMessage = "Failed to download kubeconfig"

      // Click the download button and reject the promise
      await act(async () => {
        downloadButton.click()
        kubeconfigDeferred.reject(new Error(errorMessage))
      })

      // Check for error message
      const errorAlert = await screen.findByText(new RegExp(errorMessage, "i"))
      expect(errorAlert).toBeInTheDocument()
    })

    it("downloads kubeconfig successfully", async () => {
      const kubeconfigData =
        "apiVersion: v1\nclusters: []\ncontexts: []\ncurrent-context: ''\nkind: Config\npreferences: {}\nusers: []"
      const kubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderMainActions({
          apiClient: {
            ...defaultMockClient,
            gardener: {
              ...defaultMockClient.gardener,
              getKubeconfig: () => kubeconfigDeferred.promise,
            },
          },
        })
      )

      const downloadButton = await screen.findByRole("button", { name: /Kube Config/i })
      expect(downloadButton).toBeInTheDocument()

      // Click the download button and resolve the promise
      await act(async () => {
        downloadButton.click()
        kubeconfigDeferred.resolve(kubeconfigData)
      })

      await waitFor(() => {
        expect(clickMock).toHaveBeenCalledTimes(1)
      })

      const errorAlert = screen.queryByRole("alert")
      expect(errorAlert).not.toBeInTheDocument()

      // Verify blob and download were triggered
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it("disables Kube Config button while download is pending", async () => {
      const user = userEvent.setup()
      const kubeconfigDeferred = deferredPromise<string>()
      await act(async () =>
        renderMainActions({
          apiClient: {
            ...defaultMockClient,
            gardener: {
              ...defaultMockClient.gardener,
              getKubeconfig: () => kubeconfigDeferred.promise,
            },
          },
        })
      )

      const kubeConfigButton = await screen.findByRole("button", { name: /kube config/i })
      await user.click(kubeConfigButton)

      // Verify button is disabled while pending
      await waitFor(() => {
        expect(kubeConfigButton).toBeDisabled()
      })
    })
  })

  describe("delete cluster/", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("shows delete button when user has permission", async () => {
      await act(async () => renderMainActions())

      const deleteButton = screen.getByRole("button", { name: /delete cluster/i })
      expect(deleteButton).toBeInTheDocument()
      expect(deleteButton).not.toBeDisabled()
    })

    it("opens DeleteDialog when clicking Delete Cluster button", async () => {
      await act(async () => renderMainActions())

      const deleteButton = await screen.findByRole("button", { name: /delete cluster/i })
      expect(deleteButton).toBeInTheDocument()

      act(() => {
        deleteButton.click()
      })

      expect(screen.getByRole("dialog", { name: /delete cluster/i })).toBeInTheDocument()
    })

    it("closes delete dialog when cancel is clicked", async () => {
      await act(async () => renderMainActions())

      // Open dialog
      const deleteButton = await screen.findByRole("button", { name: /delete cluster/i })
      act(() => {
        deleteButton.click()
      })

      // Close dialog
      const cancelButton = await screen.findByRole("button", { name: /cancel/i })
      act(() => {
        cancelButton.click()
      })

      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("shows error message when deletion fails", async () => {
      const deleteDeferred = deferredPromise<Cluster>()

      await act(async () =>
        renderMainActions({
          apiClient: {
            ...defaultMockClient,
            gardener: {
              ...defaultMockClient.gardener,
              confirm_deletion_and_destroy: () => deleteDeferred.promise,
            },
          },
        })
      )

      // open dialog
      const deleteBtn = screen.getByRole("button", { name: /delete cluster/i })
      fireEvent.click(deleteBtn)

      const input = screen.getByLabelText(/Name/i)
      expect(input).toBeInTheDocument()
      fireEvent.change(input, { target: { value: defaultCluster.name } })

      // confirm deletion
      const confirmBtn = screen.getByRole("button", { name: /Confirm Deletion/i })
      expect(confirmBtn).toBeInTheDocument()
      expect(confirmBtn).not.toBeDisabled()

      // click confirm and reject deletion
      fireEvent.click(confirmBtn)
      const errorMessage = "Failed to delete cluster"
      await act(async () => {
        deleteDeferred.reject(new Error(errorMessage))
      })

      // check for error message
      const errorAlert = await screen.findByText(new RegExp(errorMessage, "i"))
      expect(errorAlert).toBeInTheDocument()
    })
  })
})
