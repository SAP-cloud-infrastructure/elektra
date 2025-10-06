import React from "react"
import { render, screen, act } from "@testing-library/react"
import { createRoute, createRootRoute, RouterProvider, createMemoryHistory, Outlet } from "@tanstack/react-router"
import ClusterDetail from "./$clusterName"
import { PortalProvider } from "@cloudoperators/juno-ui-components/index"
import { getTestRouter } from "../../mocks/getTestRouter"
import { defaultCluster } from "../../mocks/data"
import { Breadcrumb } from "../../components/Breadcrumb"
import { Cluster } from "../../types/cluster"

const renderComponent = ({
  clusterDetailsPromise = Promise.resolve(defaultCluster),
  permissionsPromise = Promise.resolve({ get: true, update: true, delete: true }),
} = {}) => {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/clusters/$clusterName",
    loader: async () =>
      Promise.resolve({
        crumb: {
          label: `${defaultCluster.name}`,
        },
        clusterDetailsPromise,
        permissionsPromise,
      }),
    component: () => (
      <PortalProvider>
        <Breadcrumb data-testid="main-breadcrumb" />
        <ClusterDetail />
      </PortalProvider>
    ),
  })
  const routeTree = rootRoute.addChildren([testRoute])
  const router = getTestRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [`/clusters/${defaultCluster.name}`],
    }),
  })

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

describe("<ClusterDetail />", () => {
  it("renders cluster basic layout correctly", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText(`Cluster ${defaultCluster.name} Information`)).toBeInTheDocument()
    const deleteButton = screen.getByRole("button", { name: /delete cluster/i })
    expect(deleteButton).toBeInTheDocument()
    const editButton = screen.getByRole("button", { name: /edit cluster/i })
    expect(editButton).toBeInTheDocument()
  })

  it("renders Overview tab correctly", async () => {
    await act(async () => renderComponent())

    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument()

    // test overview tab content basic info
    expect(screen.getByText("Basic Information")).toBeInTheDocument()

    // test overview tab content cluster labels
    expect(screen.getByText("Labels")).toBeInTheDocument()

    // test overview tab content readiness conditions
    const [sectionHeader, _] = screen.getAllByText("Readiness")
    expect(sectionHeader).toHaveClass("details-section")
  })

  it("renders JSON tab correctly", async () => {
    await act(async () => renderComponent())

    const jsonTab = screen.getByRole("tab", { name: "JSON" })
    expect(jsonTab).toBeInTheDocument()

    act(() => {
      jsonTab.click()
    })

    const jsonviewer = screen.getByTestId("json-viewer")
    expect(jsonviewer).toBeInTheDocument()
  })

  describe("Loading", () => {
    it("shows loading state initially", async () => {
      await act(async () => renderComponent({ clusterDetailsPromise: new Promise(() => {}) }))

      expect(screen.getByTestId("loading-state")).toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "JSON" })).not.toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument()
    })

    it("disables action buttons when loading", async () => {
      await act(async () => renderComponent({ clusterDetailsPromise: new Promise(() => {}) }))

      expect(screen.getByRole("button", { name: /delete cluster/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /edit cluster/i })).toBeDisabled()
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

    it("shows error state when cluster details fail to load", async () => {
      let rejectClusterDetails: (err: any) => void

      // The promise is already rejected when the component mounts.
      // React Router treats it as a loader error and throws a “server error” outside the render tree.
      // As a result, the CatchBoundary never sees it, and Jest reports an unhandled rejection causing the test to fail.
      const clusterDetailsPromise: Promise<Cluster> = new Promise((_, reject) => {
        rejectClusterDetails = reject
      })

      await act(async () => {
        renderComponent({
          clusterDetailsPromise,
        })
      })

      await act(async () => {
        rejectClusterDetails!(new Error("Failed to load cluster details"))
      })

      expect(await screen.findByText("Server Error: Failed to load cluster details")).toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "JSON" })).not.toBeInTheDocument()
      expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })

    it("disables action buttons when cluster details fail to load", async () => {
      let rejectClusterDetails: (err: any) => void

      // The promise is already rejected when the component mounts.
      // React Router treats it as a loader error and throws a “server error” outside the render tree.
      // As a result, the CatchBoundary never sees it, and Jest reports an unhandled rejection causing the test to fail.
      const clusterDetailsPromise: Promise<Cluster> = new Promise((_, reject) => {
        rejectClusterDetails = reject
      })

      await act(async () => {
        renderComponent({
          clusterDetailsPromise,
        })
      })

      await act(async () => {
        rejectClusterDetails!(new Error("Failed to load cluster details"))
      })

      expect(screen.getByRole("button", { name: /delete cluster/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /edit cluster/i })).toBeDisabled()
    })
  })
})
