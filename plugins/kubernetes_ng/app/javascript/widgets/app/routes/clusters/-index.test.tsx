import React from "react"
import { render, screen, act } from "@testing-library/react"
import { createRoute, createRootRoute, RouterProvider, createMemoryHistory, Outlet } from "@tanstack/react-router"
import Clusters from "./index"
import { PortalProvider } from "@cloudoperators/juno-ui-components/index"
import { getTestRouter } from "../../mocks/getTestRouter"
import { defaultCluster } from "../../mocks/data"
import { Breadcrumb } from "../../components/Breadcrumb"
import { Cluster } from "../../types/cluster"

const renderComponent = ({
  clustersPromise = Promise.resolve([defaultCluster]),
  permissionsPromise = Promise.resolve({ get: true, update: true, delete: true }),
} = {}) => {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/clusters/",
    loader: async () =>
      Promise.resolve({
        crumb: {
          label: "Clusters",
          icon: "home",
        },
        clustersPromise,
        permissionsPromise,
      }),
    component: () => (
      <PortalProvider>
        <Breadcrumb data-testid="main-breadcrumb" />
        <Clusters />
      </PortalProvider>
    ),
  })
  const routeTree = rootRoute.addChildren([testRoute])
  const router = getTestRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ["/clusters/"],
    }),
  })

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

describe("<Clusters />", () => {
  it("renders heading and description", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText("Kubernetes Clusters")).toBeInTheDocument()
    expect(screen.getByText("Manage your VM-based Kubernetes deployments")).toBeInTheDocument()
  })

  it("renders main buttons", async () => {
    await act(async () => renderComponent())

    const addClusterButton = screen.getByRole("button", { name: "Add Cluster" })
    expect(addClusterButton).toBeInTheDocument()
    expect(addClusterButton).toHaveClass("juno-button-default")
  })

  it("renders cluster list", async () => {
    await act(async () => renderComponent())

    const list = screen.getByTestId("cluster-list")
    expect(list).toBeInTheDocument()
  })

  it("renders breadcrumb", async () => {
    await act(async () => renderComponent())

    const breadcrumb = screen.getByTestId("main-breadcrumb")
    expect(breadcrumb).toBeInTheDocument()
    expect(breadcrumb).toHaveTextContent("Clusters")
  })

  describe("Loading", () => {
    it("shows loading state within the clusters list", async () => {
      await act(async () => renderComponent({ clustersPromise: new Promise(() => {}) }))

      expect(screen.getByTestId("cluster-list")).toBeInTheDocument()
      expect(screen.getByTestId("loading-state")).toBeInTheDocument()
    })

    it("disables action buttons when loading", async () => {
      await act(async () => renderComponent({ clustersPromise: new Promise(() => {}) }))

      expect(screen.getByRole("button", { name: /Add Cluster/i })).toBeDisabled()
    })
  })

  describe("Error", () => {
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it("shows error state within the clusters list", async () => {
      let rejectClustersList: (err: any) => void

      // The promise is already rejected when the component mounts.
      // React Router treats it as a loader error and throws a “server error” outside the render tree.
      // As a result, the CatchBoundary never sees it, and Jest reports an unhandled rejection causing the test to fail.
      const clustersPromise: Promise<Cluster[]> = new Promise((_, reject) => {
        rejectClustersList = reject
      })

      await act(async () => {
        renderComponent({
          clustersPromise,
        })
      })

      await act(async () => {
        rejectClustersList!(new Error("Failed to load clusters"))
      })

      expect(await screen.findByText("Server Error: Failed to load clusters")).toBeInTheDocument()
      expect(screen.getByTestId("cluster-list")).toBeInTheDocument()
    })

    it("disables new cluster button when there is an error", async () => {
      let rejectClustersList: (err: any) => void

      // The promise is already rejected when the component mounts.
      // React Router treats it as a loader error and throws a “server error” outside the render tree.
      // As a result, the CatchBoundary never sees it, and Jest reports an unhandled rejection causing the test to fail.
      const clustersPromise: Promise<Cluster[]> = new Promise((_, reject) => {
        rejectClustersList = reject
      })

      await act(async () => {
        renderComponent({
          clustersPromise,
        })
      })

      await act(async () => {
        rejectClustersList!(new Error("Failed to load clusters"))
      })

      expect(screen.getByRole("button", { name: /Add Cluster/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /Refresh/i })).not.toBeDisabled()
    })
  })
})
