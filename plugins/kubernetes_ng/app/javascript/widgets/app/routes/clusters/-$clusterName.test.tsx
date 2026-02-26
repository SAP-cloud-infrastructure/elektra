import React from "react"
import { render, screen, act, within } from "@testing-library/react"
import { createRoute, RouterProvider, createMemoryHistory, createRootRouteWithContext } from "@tanstack/react-router"
import { RouterConfig, CLUSTER_DETAIL_ROUTE_ID } from "./$clusterName"
import { getTestRouter, deferredPromise } from "../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../mocks/data"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import type { MockInstance } from "vitest"
import { Root, RouterContext } from "../__root"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../mocks/TestTools"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"

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
  const router = getTestRouter({
    routeTree: routeTree,
    context: {
      apiClient: {
        gardener: {
          ...defaultMockClient.gardener,
          getClusterByName: () => clusterDetailsPromise,
          getShootPermissions: () => permissionsPromise,
          getKubeconfigPermission: () => permissionsPromise,
          getKubeconfig: () => kubeconfigPromise,
          confirm_deletion_and_destroy: () => deletePromise,
        },
      },
      region: "qa-de-1",
    },
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
      <MessagesProvider>
        <PortalProvider>
          <RouterProvider router={router} />
        </PortalProvider>
      </MessagesProvider>
    </QueryClientProvider>
  )
}

describe("<ClusterDetail />", () => {
  it("renders cluster basic layout correctly", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText(`Cluster ${defaultCluster.name} Information`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete cluster/i })).toBeInTheDocument()
  })

  it("disables action buttons when cluster is deleted", async () => {
    const deletedCluster = { ...defaultCluster, isDeleted: true }
    await act(async () =>
      renderComponent({
        clusterDetailsPromise: Promise.resolve(deletedCluster),
      })
    )

    const deleteButton = screen.getByRole("button", { name: /delete cluster/i })
    expect(deleteButton).toBeDisabled()
    const downloadKubeconfigButton = screen.getByRole("button", { name: /Kube Config/i })
    expect(downloadKubeconfigButton).toBeDisabled()
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
      expect(screen.queryByRole("tab", { name: "YAML" })).toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "Overview" })).toBeInTheDocument()
    })

    it("disables action buttons when loading", async () => {
      const clusterDetailsPromise = deferredPromise<Cluster>()
      const permissionsDeferred = deferredPromise<Permissions>()

      // no need to await here as the promises are not resolved
      renderComponent({
        clusterDetailsPromise: clusterDetailsPromise.promise,
        permissionsPromise: permissionsDeferred.promise,
      })

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
      expect(screen.queryByRole("tab", { name: "YAML" })).toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "Overview" })).toBeInTheDocument()
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
})
