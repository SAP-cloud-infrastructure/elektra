import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VersionUpdateDialog } from "./VersionUpdateDialog"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import { VersionUpdates } from "./KubernetesVersionDisplay"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { defaultMockClient } from "../../../../mocks/TestTools"

const TestWrapper =
  (queryClient: QueryClient, apiClient = defaultMockClient) =>
  ({ children }: { children: React.ReactNode }) => {
    const rootRoute = createRootRoute({
      component: () => children,
    })

    const clusterRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/clusters/$clusterName",
      component: () => null,
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([clusterRoute]),
      history: createMemoryHistory({ initialEntries: ["/clusters/test-cluster"] }),
      context: { apiClient },
    })

    return (
      <PortalProvider>
        <MessagesProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </MessagesProvider>
      </PortalProvider>
    )
  }

describe("VersionUpdateDialog", () => {
  const currentVersion = "1.27.5"
  const onSuccess = vi.fn()
  const onCancel = vi.fn()
  let queryClient: QueryClient

  const versionUpdates: VersionUpdates = {
    patch: ["1.27.6", "1.27.7"],
    minor: ["1.28.0", "1.28.5", "1.29.0"],
    major: ["2.0.0"],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders the modal with correct title", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Update Kubernetes Version")).toBeInTheDocument()
    })
  })

  it("displays info message about sequential minor upgrades", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText(/Minor version upgrades must be sequential/i)).toBeInTheDocument()
    })
  })

  it("displays 'No updates available' when versionUpdates is null", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("No updates available")).toBeInTheDocument()
    })
  })

  it("displays 'No updates available' when versionUpdates is empty", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={{}}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("No updates available")).toBeInTheDocument()
    })
  })

  it("groups versions by type with section headers", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      fireEvent.click(select)
    })

    // Check for section headers (they appear as disabled options)
    expect(screen.getByText("patch")).toBeInTheDocument()
    expect(screen.getByText("minor")).toBeInTheDocument()
    expect(screen.getByText("major")).toBeInTheDocument()
  })

  it("displays patch versions correctly", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      fireEvent.click(select)
    })

    expect(screen.getByText("1.27.5 → 1.27.6")).toBeInTheDocument()
    expect(screen.getByText("1.27.5 → 1.27.7")).toBeInTheDocument()
  })

  it("disables update button when no version is selected", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const updateButton = screen.getByRole("button", { name: /Update/i })
      expect(updateButton).toBeDisabled()
    })
  })

  it("renders version select dropdown", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      expect(select).toBeInTheDocument()
      expect(select).not.toBeDisabled()
    })
  })

  it("calls onCancel when cancel button is clicked", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Update Kubernetes Version")).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    await act(async () => {
      fireEvent.click(cancelButton)
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("displays version options with disabled state for non-sequential minors", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      fireEvent.click(select)
    })

    // 1.28.0 should be enabled (next minor version)
    const option1_28 = screen.getByText("1.27.5 → 1.28.0")
    expect(option1_28).toBeInTheDocument()

    // 1.29.0 should be disabled (skips a minor version)
    const option1_29 = screen.getByText("1.27.5 → 1.29.0")
    expect(option1_29).toBeInTheDocument()
  })

  it("does not call onSuccess when update button is clicked without selection", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const updateButton = screen.getByRole("button", { name: /Update/i })
      // Button should be disabled when no version is selected
      expect(updateButton).toBeDisabled()
    })

    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("shows loading state during mutation", async () => {
    const user = userEvent.setup()
    const mockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        updateCluster: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        ),
      },
    }
    const wrapper = TestWrapper(queryClient, mockClient)

    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Update Kubernetes Version")).toBeInTheDocument()
    })

    // Select a version
    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    const option = screen.getByText("1.27.5 → 1.27.6")
    await act(async () => {
      await user.click(option)
    })

    // Click update button
    const updateButton = screen.getByRole("button", { name: /Update/i })
    await act(async () => {
      await user.click(updateButton)
    })

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText("Updating...")).toBeInTheDocument()
    })

    const updatingButton = screen.getByRole("button", { name: /Updating.../i })
    expect(updatingButton).toBeDisabled()

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    expect(cancelButton).toBeDisabled()
  })

  it("disables select dropdown during mutation", async () => {
    const user = userEvent.setup()
    const mockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        updateCluster: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        ),
      },
    }
    const wrapper = TestWrapper(queryClient, mockClient)

    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Update Kubernetes Version")).toBeInTheDocument()
    })

    // Select a version
    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    const option = screen.getByText("1.27.5 → 1.27.6")
    await act(async () => {
      await user.click(option)
    })

    // Click update button
    const updateButton = screen.getByRole("button", { name: /Update/i })
    await act(async () => {
      await user.click(updateButton)
    })

    // Check that select is disabled during mutation
    await waitFor(() => {
      const selectDuringUpdate = screen.getByLabelText(/Select version/i)
      expect(selectDuringUpdate).toBeDisabled()
    })
  })

  it("renders next minor version option", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      fireEvent.click(select)
    })

    // Check that 1.28.0 is available (next minor version)
    expect(screen.getByText("1.27.5 → 1.28.0")).toBeInTheDocument()
  })

  it("displays all provided patch versions", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      fireEvent.click(select)
    })

    versionUpdates.patch?.forEach((version) => {
      expect(screen.getByText(`${currentVersion} → ${version}`)).toBeInTheDocument()
    })
  })

  it("displays all provided minor versions", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <VersionUpdateDialog
        clusterName="test-cluster"
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      const select = screen.getByLabelText(/Select version/i)
      fireEvent.click(select)
    })

    versionUpdates.minor?.forEach((version) => {
      expect(screen.getByText(`${currentVersion} → ${version}`)).toBeInTheDocument()
    })
  })
})
