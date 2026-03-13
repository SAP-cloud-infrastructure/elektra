import { render, screen, act, waitFor } from "@testing-library/react"
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router"
import { Route as ClustersRoute, CLUSTERS_ROUTE_ID } from "./index"
import { getTestRouter, deferredPromise, defaultMockClient } from "../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../mocks/data"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { MockInstance } from "vitest"
import { RouterContext } from "../__root"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const renderComponent = ({
  clustersPromise = Promise.resolve([defaultCluster]),
  permissionsPromise = Promise.resolve(permissionsAllTrue),
} = {}) => {
  const mockClient: RouterContext = {
    apiClient: {
      gardener: {
        ...defaultMockClient.gardener,
        // Return the promise directly so each query call gets the same promise instance
        // For errors, this means we need to create a function that returns a new rejected promise each time
        getClusters: typeof clustersPromise === "function" ? clustersPromise : () => clustersPromise,
        getShootPermissions: typeof permissionsPromise === "function" ? permissionsPromise : () => permissionsPromise,
      },
    },
    region: "qa-de-1",
  }

  const router = getTestRouter({
    routeTree: ClustersRoute,
    context: mockClient,
    history: createMemoryHistory({ initialEntries: [CLUSTERS_ROUTE_ID] }),
  })

  // Create a new QueryClient for each test to ensure isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        staleTime: 0, // Always treat data as stale
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}, // Suppress error logs in tests
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MessagesProvider>
        <RouterProvider router={router} />
      </MessagesProvider>
    </QueryClientProvider>
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
      // Pass a function that throws an error asynchronously
      const clustersPromise = async () => {
        throw new Error("Failed to fetch clusters")
      }
      const permissionsPromise = Promise.resolve(permissionsAllTrue)

      renderComponent({ clustersPromise, permissionsPromise })

      // InlineError renders "Error: " prefix before the message
      // Wait for the error to be displayed
      await waitFor(
        async () => {
          const errorText = screen.getByText(/error:.*failed to fetch clusters/i)
          expect(errorText).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it("disables new cluster button when there is an error", async () => {
      // Pass a function that throws an error asynchronously
      const clustersPromise = async () => {
        throw new Error("Failed to fetch clusters")
      }
      const permissionsPromise = Promise.resolve(permissionsAllTrue)

      renderComponent({ clustersPromise, permissionsPromise })

      const addClusterButton = await screen.findByRole("button", { name: /Add Cluster/i })
      expect(addClusterButton).toBeDisabled()
    })
  })
})
