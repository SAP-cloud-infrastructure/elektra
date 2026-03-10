import { render, screen, act, within } from "@testing-library/react"
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router"
import { Route as ClustersRoute, CLUSTERS_ROUTE_ID } from "./index"
import { getTestRouter, deferredPromise, defaultMockClient } from "../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../mocks/data"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { MockInstance } from "vitest"
import { RouterContext } from "../__root"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"

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

  return render(
    <MessagesProvider>
      <RouterProvider router={router} />
    </MessagesProvider>
  )
}

describe("<Clusters />", () => {
  it("renders heading", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText("Kubernetes Clusters")).toBeInTheDocument()
  })

  it("renders main buttons", async () => {
    await act(async () => renderComponent())

    const addClusterButton = screen.getByRole("button", { name: "Add Cluster" })

    expect(addClusterButton).toBeInTheDocument()
    expect(addClusterButton).toHaveClass("juno-button-primary")
  })

  it("renders cluster list", async () => {
    await act(async () => renderComponent())

    const list = screen.getByRole("grid", { name: /cluster list/i })
    expect(list).toBeInTheDocument()
  })

  it("renders kubectl instructions info", async () => {
    await act(async () => renderComponent())

    const instructionsButton = screen.getByRole("button", { name: /show kubectl setup instructions/i })
    expect(instructionsButton).toBeInTheDocument()
  })

  describe("Loading", () => {
    it("shows loading state within the clusters list", async () => {
      const clustersDeferred = deferredPromise<Cluster[]>()
      const permissionsDeferred = deferredPromise<Permissions>()
      renderComponent({
        clustersPromise: clustersDeferred.promise,
        permissionsPromise: permissionsDeferred.promise,
      })
      const loadingText = await screen.findByText(/Loading clusters/i)
      expect(loadingText).toBeInTheDocument()
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
    })
  })
})
