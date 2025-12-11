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

const renderComponent = ({
  clusterDetailsPromise = Promise.resolve(defaultCluster),
  permissionsPromise = Promise.resolve(permissionsAllTrue),
} = {}) => {
  const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: Root,
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: CLUSTER_DETAIL_ROUTE_ID,
    ...RouterConfig,
  })

  // the route needs the root route as parent to get the breadcrumb working
  const routeTree = rootRoute.addChildren([testRoute])

  const mockClient: RouterContext = {
    apiClient: {
      gardener: {
        getClusters: () => Promise.resolve([defaultCluster]),
        getPermissions: () => permissionsPromise,
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

  return render(<RouterProvider router={router} />)
}

describe("<ClusterDetail />", () => {
  it("renders cluster basic layout correctly", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText(`Cluster ${defaultCluster.name} Information`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete cluster/i })).toBeInTheDocument()
  })

  it("renders updated at", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument()
  })

  it("renders Overview tab correctly", async () => {
    await act(async () => renderComponent())

    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Basic Information" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Readiness" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Latest Operation & Errors" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Maintenance Window" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Worker Pools" })).toBeInTheDocument()
  })

  it("renders JSON tab correctly", async () => {
    await act(async () => renderComponent())

    const jsonTab = screen.getByRole("tab", { name: "JSON" })
    expect(jsonTab).toBeInTheDocument()

    act(() => {
      jsonTab.click()
    })

    const someKey = Object.keys(defaultCluster.raw)[0]
    const jsonViewer = await screen.findByText(new RegExp(someKey, "i"))
    expect(jsonViewer).toBeInTheDocument()
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
      // expect(screen.getByText("Sample error message")).toBeInTheDocument()

      // // Render without errors
      // await act(async () =>
      //   renderComponent({
      //     clusterDetailsPromise: Promise.resolve(defaultCluster),
      //   })
      // )

      // expect(screen.getByRole("heading", { level: 2, name: "Latest Operation & Errors" })).toBeInTheDocument()
      // expect(screen.queryByText("Sample error message")).not.toBeInTheDocument()
    })
  })
})
