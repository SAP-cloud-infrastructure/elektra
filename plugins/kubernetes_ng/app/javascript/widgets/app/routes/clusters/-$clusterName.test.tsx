import React from "react"
import { render, screen, act, within, waitFor, fireEvent } from "@testing-library/react"
import { createRoute, RouterProvider, createMemoryHistory, createRootRouteWithContext } from "@tanstack/react-router"
import { RouterConfig, CLUSTER_DETAIL_ROUTE_ID } from "./$clusterName"
import { getTestRouter, deferredPromise } from "../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../mocks/data"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import type { MockInstance } from "vitest"
import { Root, RouterContext } from "../__root"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const renderComponent = ({
  clusterDetailsPromise = Promise.resolve(defaultCluster),
  permissionsPromise = Promise.resolve(permissionsAllTrue),
  kubeconfigPromise = Promise.resolve("kubeconfig-data"),
  deletePromise = Promise.resolve(defaultCluster),
} = {}) => {
  const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: Root,
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: CLUSTER_DETAIL_ROUTE_ID,
    ...RouterConfig,
  })

  // Add the clusters list route so navigation after delete works
  const clustersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/clusters",
    component: () => <div>Clusters List Overview Page</div>,
  })

  // the route needs the root route as parent to get the breadcrumb working
  const routeTree = rootRoute.addChildren([testRoute, clustersRoute])
  const mockClient: RouterContext = {
    apiClient: {
      gardener: {
        getClusters: () => Promise.resolve([defaultCluster]),
        getShootPermissions: () => permissionsPromise,
        getKubeconfigPermission: () => permissionsPromise,
        getKubeconfig: () => kubeconfigPromise,
        confirm_deletion_and_destroy: () => deletePromise,
        getClusterByName: () => clusterDetailsPromise,
        createCluster: () => Promise.resolve(defaultCluster),
        getCloudProfiles: () => Promise.resolve([]),
        getExternalNetworks: () => Promise.resolve([]),
      },
    },
    region: "qa-de-1",
  }

  const router = getTestRouter({
    routeTree: routeTree,
    context: mockClient,
    history: createMemoryHistory({ initialEntries: [`/clusters/${defaultCluster.name}`] }),
  })

  let queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe("<ClusterDetail />", () => {
  it("renders cluster basic layout correctly", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText(`Cluster ${defaultCluster.name} Information`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete cluster/i })).toBeInTheDocument()
  })

  describe("Breadcrumb", () => {
    test("renders cluster name into breadcrumb", async () => {
      await act(async () => renderComponent())

      expect(
        within(screen.getByRole("navigation", { name: /breadcrumb/i })).getByRole("link", { name: defaultCluster.name })
      ).toBeInTheDocument()
    })
  })

  describe("Loading", () => {
    it("shows loading state initially", async () => {
      const clusterDetailsPromise = deferredPromise<Cluster>()
      const permissionsDeferred = deferredPromise<Permissions>()

      // no need to await here as the promises are not resolved
      renderComponent({
        clusterDetailsPromise: clusterDetailsPromise.promise,
        permissionsPromise: permissionsDeferred.promise,
      })

      const spinner = await screen.findByRole("progressbar", { name: /loading cluster details/i })
      expect(spinner).toBeInTheDocument()

      // Ensure tabs are not rendered yet
      expect(screen.queryByRole("tab", { name: "JSON" })).not.toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument()
    })

    it("disables action buttons when loading", async () => {
      const clusterDetailsPromise = deferredPromise<Cluster>()
      const permissionsDeferred = deferredPromise<Permissions>()

      // no need to await here as the promises are not resolved
      renderComponent({
        clusterDetailsPromise: clusterDetailsPromise.promise,
        permissionsPromise: permissionsDeferred.promise,
      })

      const refreshButton = await screen.findByRole("button", { name: /Refresh/i })
      expect(refreshButton).toBeDisabled()
      const addClusterButton = await screen.findByRole("button", { name: /delete cluster/i })
      expect(addClusterButton).toBeDisabled()
    })
  })

  describe("Loader Error", () => {
    let consoleErrorSpy: MockInstance

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it("shows error state when cluster details fail to load", async () => {
      const clusterDetailsPromise = Promise.reject(new Error("Failed to load cluster details"))
      const permissionsPromise = Promise.resolve(permissionsAllTrue)

      await act(async () =>
        renderComponent({
          clusterDetailsPromise,
          permissionsPromise,
        })
      )

      expect(screen.getByText("Error: Failed to load cluster details")).toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "JSON" })).not.toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument()
    })

    it("disables action buttons when cluster details fail to load", async () => {
      const clusterDetailsPromise = Promise.reject(new Error("Failed to load cluster details"))
      const permissionsPromise = Promise.resolve(permissionsAllTrue)

      await act(async () =>
        renderComponent({
          clusterDetailsPromise,
          permissionsPromise,
        })
      )

      expect(screen.getByRole("button", { name: /refresh/i })).not.toBeDisabled()
      expect(screen.getByRole("button", { name: /delete cluster/i })).toBeDisabled()
    })
  })

  describe("Latest Operation & Errors section", () => {
    it("renders always last operation", async () => {
      const clusterWithErrors = {
        ...defaultCluster,
        lastOperation: {
          type: "Reconcile",
          state: "Succeeded",
          progress: 100,
          description: "Cluster updated successfully",
          lastUpdateTime: "2023-10-01T12:34:56Z",
        },
      }

      // Render with errors
      await act(async () =>
        renderComponent({
          clusterDetailsPromise: Promise.resolve(clusterWithErrors),
        })
      )

      expect(screen.getByRole("heading", { level: 2, name: "Latest Operation & Errors" })).toBeInTheDocument()
      expect(screen.getByText("Cluster updated successfully")).toBeInTheDocument()
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
      const clusterDetailsPromise = Promise.resolve(defaultCluster)
      const permissionsPromise = Promise.resolve(permissionsAllTrue)
      const kubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderComponent({
          clusterDetailsPromise,
          permissionsPromise,
          kubeconfigPromise: kubeconfigDeferred.promise,
        })
      )

      const downloadButton = screen.getByRole("button", { name: /Kube Config/i })
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
      const clusterDetailsPromise = Promise.resolve(defaultCluster)
      const permissionsPromise = Promise.resolve(permissionsAllTrue)
      const kubeconfigData =
        "apiVersion: v1\nclusters: []\ncontexts: []\ncurrent-context: ''\nkind: Config\npreferences: {}\nusers: []"
      const kubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderComponent({
          clusterDetailsPromise,
          permissionsPromise,
          kubeconfigPromise: kubeconfigDeferred.promise,
        })
      )

      const downloadButton = screen.getByRole("button", { name: /Kube Config/i })
      expect(downloadButton).toBeInTheDocument()

      // Click the download button and resolve the promise
      await act(async () => {
        downloadButton.click()
        kubeconfigDeferred.resolve(kubeconfigData)
      })

      await waitFor(() => {
        expect(clickMock).toHaveBeenCalledTimes(1)
      })

      // Since we cannot check the file download directly, we can at least ensure no error is shown
      const errorAlert = screen.queryByRole("alert")
      expect(errorAlert).not.toBeInTheDocument()
    })
  })

  describe("delete cluster/", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("shows delete button when user has permission", async () => {
      await act(async () => renderComponent())

      const deleteButton = screen.getByRole("button", { name: /delete cluster/i })
      expect(deleteButton).toBeInTheDocument()
      expect(deleteButton).not.toBeDisabled()
    })

    it("does not show delete button when user lacks permission", async () => {
      const noDeletePermissions: Permissions = {
        ...permissionsAllTrue,
        delete: false,
      }

      await act(async () =>
        renderComponent({
          permissionsPromise: Promise.resolve(noDeletePermissions),
        })
      )

      const deleteButton = screen.queryByRole("button", { name: /delete cluster/i })
      // expect disablded button
      expect(deleteButton).toBeDisabled()
    })

    it("opens DeleteDialog when clicking Delete Cluster button", async () => {
      await act(async () => renderComponent())

      const deleteButton = screen.getByRole("button", { name: /delete cluster/i })
      expect(deleteButton).toBeInTheDocument()

      act(() => {
        deleteButton.click()
      })

      expect(screen.getByRole("dialog", { name: /delete cluster/i })).toBeInTheDocument()
    })

    it("redirects when confirming deletion", async () => {
      await act(async () => renderComponent())

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
      fireEvent.click(confirmBtn)

      expect(await screen.findByText("Clusters List Overview Page")).toBeInTheDocument()
    })

    it("shows error message when deletion fails", async () => {
      const deleteDeferred = deferredPromise<Cluster>()
      await act(async () =>
        renderComponent({
          deletePromise: deleteDeferred.promise,
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
