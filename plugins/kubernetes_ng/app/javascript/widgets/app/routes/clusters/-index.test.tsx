import { render, screen, act, within } from "@testing-library/react"
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router"
import { Route as ClustersRoute, CLUSTERS_ROUTE_ID } from "./index"
import { getTestRouter, deferredPromise, defaultMockClient } from "../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../mocks/data"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { MockInstance } from "vitest"
import { RouterContext } from "../__root"

const renderComponent = ({
  clustersPromise = Promise.resolve([defaultCluster]),
  permissionsPromise = Promise.resolve(permissionsAllTrue),
} = {}) => {
  const mockClient: RouterContext = {
    apiClient: {
      gardener: {
        ...defaultMockClient.gardener,
        getClusters: () => clustersPromise,
        getShootPermissions: () => permissionsPromise,
      },
    },
    region: "qa-de-1",
  }

  const router = getTestRouter({
    routeTree: ClustersRoute,
    context: mockClient,
    history: createMemoryHistory({ initialEntries: [CLUSTERS_ROUTE_ID] }),
  })

  return render(<RouterProvider router={router} />)
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
    const refreshButton = screen.getByRole("button", { name: "Refresh" })

    expect(refreshButton).toBeInTheDocument()
    expect(refreshButton).toHaveClass("juno-button-default")
    expect(addClusterButton).toBeInTheDocument()
    expect(addClusterButton).toHaveClass("juno-button-primary")
  })

  it("renders cluster list", async () => {
    await act(async () => renderComponent())

    const list = screen.getByRole("grid", { name: /cluster list/i })
    expect(list).toBeInTheDocument()
  })

  it("displays a message if location.state has a successMessage", async () => {
    const successMessage = "Cluster created successfully"

    const router = getTestRouter({
      routeTree: ClustersRoute,
      context: {
        apiClient: defaultMockClient,
        region: "qa-de-1",
      },
      history: createMemoryHistory({ initialEntries: [CLUSTERS_ROUTE_ID] }),
    })

    router.navigate({
      to: "/clusters",
      state: { successMessage },
    })

    render(<RouterProvider router={router} />)

    expect(await screen.findByText(successMessage)).toBeInTheDocument()
  })

  describe("Loading", () => {
    it("shows loading state within the clusters list", async () => {
      const clustersDeferred = deferredPromise<Cluster[]>()
      const permissionsDeferred = deferredPromise<Permissions>()
      renderComponent({
        clustersPromise: clustersDeferred.promise,
        permissionsPromise: permissionsDeferred.promise,
      })
      const spinner = await screen.findByRole("progressbar", { name: /loading clusters/i })
      expect(spinner).toBeInTheDocument()
    })

    it("disables action buttons when loading", async () => {
      const clustersDeferred = deferredPromise<Cluster[]>()
      const permissionsDeferred = deferredPromise<Permissions>()
      renderComponent({
        clustersPromise: clustersDeferred.promise,
        permissionsPromise: permissionsDeferred.promise,
      })
      const addClusterButton = await screen.findByRole("button", { name: /Add Cluster/i })
      expect(addClusterButton).toBeDisabled()
      const refreshButton = await screen.getByRole("button", { name: /Refresh/i })
      expect(refreshButton).toBeDisabled()
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

    it("shows error state within the clusters list", async () => {
      const clustersPromise = Promise.reject(new Error("Failed to fetch clusters"))
      const permissionsPromise = Promise.resolve(permissionsAllTrue)

      renderComponent({ clustersPromise, permissionsPromise })

      // Wait for the cluster list container
      const list = await screen.findByRole("grid", { name: /cluster list/i })
      expect(list).toBeInTheDocument()

      // Wait for the error message inside it
      const errorMessage = await within(list).findByText(/failed to fetch clusters/i)
      expect(errorMessage).toBeInTheDocument()
    })

    it("disables new cluster button when there is an error", async () => {
      const clustersPromise = Promise.reject(new Error("Failed to fetch clusters"))
      const permissionsPromise = Promise.resolve(permissionsAllTrue)

      renderComponent({ clustersPromise, permissionsPromise })

      const addClusterButton = await screen.findByRole("button", { name: /Add Cluster/i })
      expect(addClusterButton).toBeDisabled()
      const refreshButton = screen.getByRole("button", { name: /Refresh/i })
      expect(refreshButton).not.toBeDisabled()
    })
  })
})
