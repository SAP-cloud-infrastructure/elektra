import { render, screen, act, waitFor } from "@testing-library/react"
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router"
import { Route as ClustersRoute, CLUSTERS_ROUTE_ID } from "./index"
import { getTestRouter, deferredPromise, defaultMockClient } from "../../mocks/TestTools"
import { defaultCluster, permissionsAllTrue } from "../../mocks/data"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { MockInstance } from "vitest"
import { RouterContext } from "../__root"
import { MessagesProvider, Messages } from "@cloudoperators/juno-messages-provider"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
global.URL.revokeObjectURL = vi.fn()

const renderComponent = ({
  clustersPromise = Promise.resolve([defaultCluster]),
  permissionsPromise = Promise.resolve(permissionsAllTrue),
  gardenKubeconfigPromise = Promise.resolve("kubeconfig-data"),
}: {
  clustersPromise?: Promise<Cluster[]> | (() => Promise<Cluster[]>)
  permissionsPromise?: Promise<Permissions> | (() => Promise<Permissions>)
  gardenKubeconfigPromise?: Promise<string> | (() => Promise<string>)
} = {}) => {
  const mockClient: RouterContext = {
    apiClient: {
      gardener: {
        ...defaultMockClient.gardener,
        // Return the promise directly so each query call gets the same promise instance
        // For errors, this means we need to create a function that returns a new rejected promise each time
        getClusters: typeof clustersPromise === "function" ? clustersPromise : () => clustersPromise,
        getShootPermissions: typeof permissionsPromise === "function" ? permissionsPromise : () => permissionsPromise,
        getGardenerApiKubeconfig:
          typeof gardenKubeconfigPromise === "function" ? gardenKubeconfigPromise : () => gardenKubeconfigPromise,
      },
    },
    region: "qa-de-1",
    projectid: "test",
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
        <PortalProvider>
          <Messages />
          <RouterProvider router={router} />
        </PortalProvider>
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
    const gardenKubeconfigButton = screen.getByRole("button", { name: /Garden.*Kubeconfig/i })

    expect(addClusterButton).toBeInTheDocument()
    expect(addClusterButton).toHaveClass("juno-button-primary")
    expect(gardenKubeconfigButton).toBeInTheDocument()
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
      const gardenKubeconfigButton = await screen.findByRole("button", { name: /Garden.*Kubeconfig/i })
      expect(addClusterButton).toBeDisabled()
      expect(gardenKubeconfigButton).toBeDisabled()
    })
  })

  describe("Garden Kubeconfig download", () => {
    let consoleErrorSpy: MockInstance
    let clickMock: ReturnType<typeof vi.fn>
    let originalCreateElement: typeof document.createElement

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

    it("shows error message when garden kubeconfig download fails", async () => {
      const gardenKubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderComponent({
          gardenKubeconfigPromise: gardenKubeconfigDeferred.promise,
        })
      )

      const downloadButton = await screen.findByRole("button", { name: /Garden.*Kubeconfig/i })
      expect(downloadButton).toBeInTheDocument()

      const errorMessage = "Failed to fetch garden kubeconfig"

      // Click the download button and reject the promise
      await act(async () => {
        downloadButton.click()
        gardenKubeconfigDeferred.reject(new Error(errorMessage))
      })

      // Check for error message
      const errorAlert = await screen.findByText(new RegExp(errorMessage, "i"))
      expect(errorAlert).toBeInTheDocument()
    })

    it("downloads garden kubeconfig successfully", async () => {
      const kubeconfigData =
        "apiVersion: v1\nclusters:\n- cluster:\n    server: https://gardener.example.com\n  name: garden\ncontexts:\n- context:\n    cluster: garden\n    user: garden-user\n    namespace: garden-qa-de-1-test\n  name: garden\ncurrent-context: garden\nkind: Config\nusers:\n- name: garden-user\n  user:\n    token: qa-de-1:test-token"
      const gardenKubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderComponent({
          gardenKubeconfigPromise: gardenKubeconfigDeferred.promise,
        })
      )

      const downloadButton = await screen.findByRole("button", { name: /Garden.*Kubeconfig/i })
      expect(downloadButton).toBeInTheDocument()

      // Click the download button and resolve the promise
      await act(async () => {
        downloadButton.click()
        gardenKubeconfigDeferred.resolve(kubeconfigData)
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

    it("disables Garden Kubeconfig button while download is pending", async () => {
      const user = userEvent.setup()
      const gardenKubeconfigDeferred = deferredPromise<string>()

      await act(async () =>
        renderComponent({
          gardenKubeconfigPromise: gardenKubeconfigDeferred.promise,
        })
      )

      const gardenKubeconfigButton = await screen.findByRole("button", { name: /Garden.*Kubeconfig/i })
      await user.click(gardenKubeconfigButton)

      // Verify button is disabled while pending
      await waitFor(() => {
        expect(gardenKubeconfigButton).toBeDisabled()
      })
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

      // Wait for the error message to be displayed (don't depend on InlineError's format)
      await waitFor(
        async () => {
          const errorText = screen.getByText(/failed to fetch clusters/i)
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

      await waitFor(async () => {
        const addClusterButton = await screen.findByRole("button", { name: /Add Cluster/i })
        expect(addClusterButton).toBeDisabled()

        // Note: Garden Kubeconfig button is NOT disabled on query error
        // It only disables during loading or when mutation is pending
        const gardenKubeconfigButton = await screen.findByRole("button", { name: /Garden.*Kubeconfig/i })
        expect(gardenKubeconfigButton).not.toBeDisabled()
      })
    })
  })
})
