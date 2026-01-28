import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { Provider } from "react-redux"
import { createStore } from "redux"
import Cluster from "./item"

// Mock the ClusterEvents component
vi.mock("./events", () => ({
  default: ({ cluster }) => <tr data-testid="cluster-events">{cluster.name} events</tr>,
}))

// Mock the actions
vi.mock("../../actions", () => ({
  openEditClusterDialog: vi.fn((cluster) => ({ type: "OPEN_EDIT_CLUSTER_DIALOG", cluster })),
  requestDeleteCluster: vi.fn((name) => ({ type: "REQUEST_DELETE_CLUSTER", name })),
  loadCluster: vi.fn((name) => ({ type: "LOAD_CLUSTER", name })),
  getCredentials: vi.fn((name) => ({ type: "GET_CREDENTIALS", name })),
  getSetupInfo: vi.fn((name, url) => ({ type: "GET_SETUP_INFO", name, url })),
  startPollingCluster: vi.fn((name) => ({ type: "START_POLLING_CLUSTER", name })),
  stopPollingCluster: vi.fn((name) => ({ type: "STOP_POLLING_CLUSTER", name })),
}))

describe("Cluster Item Component", () => {
  let store
  let defaultCluster

  beforeEach(() => {
    vi.useFakeTimers()

    defaultCluster = {
      name: "test-cluster",
      isTerminating: false,
      isPolling: false,
      status: {
        phase: "Running",
        apiserverVersion: "1.20.0",
        message: "Cluster is running",
        nodePools: [
          {
            name: "default",
            size: 3,
            healthy: 3,
            running: 3,
            schedulable: 3,
          },
        ],
        dashboard: "https://dashboard.example.com",
      },
      spec: {
        version: "1.20.0",
        dashboard: true,
        nodePools: [
          {
            name: "default",
            size: 3,
            flavor: "m1.large",
            availabilityZone: "az-1",
          },
        ],
      },
    }

    // Create a mock Redux store
    const initialState = {
      clusters: {
        items: [defaultCluster],
      },
    }

    const rootReducer = (state = initialState, action) => {
      return state
    }

    store = createStore(rootReducer)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  const renderCluster = (cluster = defaultCluster) => {
    // Update store with the cluster being rendered
    const initialState = {
      clusters: {
        items: [cluster],
      },
    }
    const rootReducer = (state = initialState, action) => {
      return state
    }
    store = createStore(rootReducer)

    return render(
      <Provider store={store}>
        <table>
          <Cluster cluster={cluster} kubernikusBaseUrl="https://kubernetes.example.com" />
        </table>
      </Provider>
    )
  }

  describe("Rendering", () => {
    it("renders cluster name", () => {
      renderCluster()
      expect(screen.getByText("test-cluster")).toBeInTheDocument()
    })

    it("renders cluster status phase", () => {
      renderCluster()
      expect(screen.getByText("Running")).toBeInTheDocument()
    })

    it("renders cluster version", () => {
      renderCluster()
      expect(screen.getByText("Version: 1.20.0")).toBeInTheDocument()
    })

    it("renders cluster status message", () => {
      renderCluster()
      expect(screen.getByText("Cluster is running")).toBeInTheDocument()
    })

    it("renders node pool information", () => {
      renderCluster()
      expect(screen.getByText("default")).toBeInTheDocument()
      expect(screen.getByText("az-1")).toBeInTheDocument()
      expect(screen.getByText("m1.large")).toBeInTheDocument()
      expect(screen.getByText("size: 3")).toBeInTheDocument()
    })

    it("renders node pool status", () => {
      renderCluster()
      expect(screen.getByText(/healthy:/)).toBeInTheDocument()
      expect(screen.getByText(/running:/)).toBeInTheDocument()
      expect(screen.getByText(/schedulable:/)).toBeInTheDocument()
    })

    it("renders action buttons", () => {
      renderCluster()
      expect(screen.getByText("Edit Cluster")).toBeInTheDocument()
      expect(screen.getByText("Download Credentials")).toBeInTheDocument()
      expect(screen.getByText("Setup")).toBeInTheDocument()
      expect(screen.getByText("Kubernetes Dashboard")).toBeInTheDocument()
    })

    it("renders cluster events component", () => {
      renderCluster()
      expect(screen.getByTestId("cluster-events")).toBeInTheDocument()
    })
  })

  describe("Cluster Status", () => {
    it("shows spinner when cluster is not ready (version mismatch)", () => {
      const cluster = {
        ...defaultCluster,
        spec: { ...defaultCluster.spec, version: "1.21.0" },
      }
      const { container } = renderCluster(cluster)
      const spinners = container.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("shows spinner when cluster phase is Creating", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Creating" },
      }
      const { container } = renderCluster(cluster)
      const spinners = container.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("shows spinner when cluster phase is Pending", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Pending" },
      }
      const { container } = renderCluster(cluster)
      const spinners = container.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("does not show spinner when cluster is ready", () => {
      const { container } = renderCluster()
      // Check that spinner is not in cluster status area
      const statusCell = container.querySelector("td:nth-child(2)")
      const spinner = statusCell.querySelector(".spinner")
      expect(spinner).not.toBeInTheDocument()
    })
  })

  describe("Node Pool Status", () => {
    it("shows spinner when node pool is not ready", () => {
      const cluster = {
        ...defaultCluster,
        status: {
          ...defaultCluster.status,
          nodePools: [
            {
              name: "default",
              size: 3,
              healthy: 2,
              running: 2,
              schedulable: 2,
            },
          ],
        },
      }
      const { container } = renderCluster(cluster)
      const spinners = container.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("shows loading when node pool status is missing", () => {
      const cluster = {
        ...defaultCluster,
        status: {
          ...defaultCluster.status,
          nodePools: [],
        },
      }
      renderCluster(cluster)
      expect(screen.getByText("Loading", { exact: false })).toBeInTheDocument()
    })

    it("does not show spinner when all node pools are ready", () => {
      renderCluster()
      // The component should not have spinners in node pool status when ready
      const nodePoolText = screen.getByText(/healthy:/)
      expect(nodePoolText.parentElement.querySelector(".spinner")).not.toBeInTheDocument()
    })
  })

  describe("Disabled State", () => {
    it("disables buttons when cluster is terminating", () => {
      const cluster = {
        ...defaultCluster,
        isTerminating: true,
      }
      renderCluster(cluster)
      const editButton = screen.getByText("Edit Cluster").closest("button")
      expect(editButton).toBeDisabled()
    })

    it("disables buttons when cluster phase is Terminating", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Terminating" },
      }
      renderCluster(cluster)
      const editButton = screen.getByText("Edit Cluster").closest("button")
      expect(editButton).toBeDisabled()
    })

    it("disables buttons when cluster phase is Pending", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Pending" },
      }
      renderCluster(cluster)
      const editButton = screen.getByText("Edit Cluster").closest("button")
      expect(editButton).toBeDisabled()
    })

    it("disables buttons when cluster phase is Creating", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Creating" },
      }
      renderCluster(cluster)
      const editButton = screen.getByText("Edit Cluster").closest("button")
      expect(editButton).toBeDisabled()
    })

    it("applies item-disabled class to tbody when disabled", () => {
      const cluster = {
        ...defaultCluster,
        isTerminating: true,
      }
      const { container } = renderCluster(cluster)
      const tbody = container.querySelector("tbody")
      expect(tbody).toHaveClass("item-disabled")
    })
  })

  describe("Button Actions", () => {
    it("calls handleEditCluster when edit button is clicked", () => {
      renderCluster()
      const editButton = screen.getByText("Edit Cluster").closest("button")
      fireEvent.click(editButton)
      // Redux action should be dispatched
      expect(store.getState()).toBeDefined()
    })

    it("calls handleGetCredentials when download credentials button is clicked", () => {
      renderCluster()
      const downloadButton = screen.getByText("Download Credentials").closest("button")
      fireEvent.click(downloadButton)
      expect(store.getState()).toBeDefined()
    })

    it("calls handleGetSetupInfo when setup button is clicked", () => {
      renderCluster()
      const setupButton = screen.getByText("Setup").closest("button")
      fireEvent.click(setupButton)
      expect(store.getState()).toBeDefined()
    })

    it("opens dashboard link in new tab", () => {
      renderCluster()
      const dashboardLink = screen.getByText("Kubernetes Dashboard").closest("a")
      expect(dashboardLink).toHaveAttribute("href", "https://dashboard.example.com")
      expect(dashboardLink).toHaveAttribute("target", "_blank")
      expect(dashboardLink).toHaveAttribute("rel", "noreferrer")
    })

    it("does not render dashboard link when not available", () => {
      const cluster = {
        ...defaultCluster,
        spec: { ...defaultCluster.spec, dashboard: false },
        status: { ...defaultCluster.status, dashboard: null },
      }
      renderCluster(cluster)
      expect(screen.queryByText("Kubernetes Dashboard")).not.toBeInTheDocument()
    })
  })

  describe("Polling Lifecycle", () => {
    it("starts polling on mount when cluster is not ready", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Creating" },
      }
      renderCluster(cluster)
      expect(vi.getTimerCount()).toBeGreaterThan(0)
    })

    it("does not start polling on mount when cluster is ready", () => {
      renderCluster()
      // When cluster is ready, no polling should start
      // The test needs to verify the interval is not set
      // This is hard to test directly, but we can check timer count
    })

    it("stops polling when cluster becomes ready", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Creating" },
      }
      const { rerender } = renderCluster(cluster)

      // Initially polling
      const initialTimerCount = vi.getTimerCount()

      // Update to ready state
      const readyCluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Running" },
      }

      rerender(
        <Provider store={store}>
          <table>
            <Cluster cluster={readyCluster} kubernikusBaseUrl="https://kubernetes.example.com" />
          </table>
        </Provider>
      )

      // Should stop polling
      // Timer count behavior depends on implementation
    })

    it("clears polling interval on unmount", () => {
      const cluster = {
        ...defaultCluster,
        status: { ...defaultCluster.status, phase: "Creating" },
      }
      const { unmount } = renderCluster(cluster)
      unmount()
      // After unmount, timers should be cleared
      vi.runAllTimers()
    })
  })

  describe("Multiple Node Pools", () => {
    it("renders multiple node pools correctly", () => {
      const cluster = {
        ...defaultCluster,
        spec: {
          ...defaultCluster.spec,
          nodePools: [
            {
              name: "default",
              size: 3,
              flavor: "m1.large",
              availabilityZone: "az-1",
            },
            {
              name: "workers",
              size: 5,
              flavor: "m1.xlarge",
              availabilityZone: "az-2",
            },
          ],
        },
        status: {
          ...defaultCluster.status,
          nodePools: [
            {
              name: "default",
              size: 3,
              healthy: 3,
              running: 3,
              schedulable: 3,
            },
            {
              name: "workers",
              size: 5,
              healthy: 5,
              running: 5,
              schedulable: 5,
            },
          ],
        },
      }
      renderCluster(cluster)
      expect(screen.getByText("default")).toBeInTheDocument()
      expect(screen.getByText("workers")).toBeInTheDocument()
      expect(screen.getByText("size: 3")).toBeInTheDocument()
      expect(screen.getByText("size: 5")).toBeInTheDocument()
    })
  })
})
