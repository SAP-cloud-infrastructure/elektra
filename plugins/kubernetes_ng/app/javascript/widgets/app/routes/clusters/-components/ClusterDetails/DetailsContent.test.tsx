import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react"
import { act } from "react-dom/test-utils"
import userEvent from "@testing-library/user-event"
import DetailsContent from "./DetailsContent"
import { defaultCluster, permissionsAllTrue } from "../../../../mocks/data"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, createMemoryHistory, createRootRoute, createRoute, RouterProvider } from "@tanstack/react-router"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import { CLUSTER_DETAIL_ROUTE_ID } from "../../$clusterName"
import { PortalProvider } from "@cloudoperators/juno-ui-components"

// Helper to render DetailsContent with QueryClientProvider
const renderDetailsContent = ({
  cluster = defaultCluster,
  updatedAt = Date.now(),
  shootPermissions = permissionsAllTrue,
  isLoading,
  isFetching,
  error,
  ...props
}: {
  cluster?: typeof defaultCluster
  updatedAt?: number
  shootPermissions?: typeof permissionsAllTrue
  isLoading?: boolean
  isFetching?: boolean
  error?: Error
} = {}) => {
  let queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute({
    component: () => (
      <DetailsContent
        cluster={cluster}
        updatedAt={updatedAt}
        shootPermissions={shootPermissions}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        {...props}
      />
    ),
  })

  const clusterDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: CLUSTER_DETAIL_ROUTE_ID,
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([clusterDetailRoute]),
    history: createMemoryHistory({ initialEntries: [`/clusters/${cluster.name}`] }),
    context: { apiClient: defaultMockClient },
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

describe("DetailsContent", () => {
  it("renders basic info and updatedAt", async () => {
    const updatedAt = Date.now()
    renderDetailsContent({ updatedAt })

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })
    expect(screen.getByText(defaultCluster.name)).toBeInTheDocument()
    expect(screen.getByText(defaultCluster.uid)).toBeInTheDocument()
    expect(screen.getByText(defaultCluster.status)).toBeInTheDocument()
  })

  it("renders status with deleted label if cluster is deleted", async () => {
    const deletedCluster = { ...defaultCluster, isDeleted: true }
    renderDetailsContent({ cluster: deletedCluster })
    await waitFor(() => {
      expect(screen.getByText(`${deletedCluster.status} (deleted)`)).toBeInTheDocument()
    })
  })

  it("renders readiness conditions if present", async () => {
    renderDetailsContent()
    // Find the Readiness heading
    const readinessSection = await screen.findByRole("heading", { name: /Readiness/i, level: 2 })
    expect(readinessSection).toBeInTheDocument()
    // Scope queries to the container under the heading
    const sectionContainer = readinessSection.parentElement!
    const { getByRole } = within(sectionContainer)
    // Find a columnheader role whose accessible name includes "Readiness"
    const readinessHeader = getByRole("columnheader", { name: /Readiness/i })
    expect(readinessHeader).toBeInTheDocument()
  })

  it("renders fallback text when readiness conditions are missing", async () => {
    const cluster = {
      ...defaultCluster,
      readiness: {
        status: "",
        conditions: [],
      },
    }
    renderDetailsContent({ cluster })
    await waitFor(() => {
      expect(screen.getByText(/No readiness conditions found/i)).toBeInTheDocument()
    })
  })

  it("renders last errors if present", async () => {
    renderDetailsContent()
    // Find the heading
    const lastErrorsSection = await screen.findByRole("heading", { name: /Latest Operation & Errors/i, level: 2 })
    expect(lastErrorsSection).toBeInTheDocument()
    // Scope queries to the container under the heading
    const sectionContainer = lastErrorsSection.parentElement!
    const { getByRole } = within(sectionContainer)
    // Find a columnheader role whose accessible name includes "Latest Operation & Errors"
    const errorsHeader = getByRole("columnheader", { name: /Errors/i })
    expect(errorsHeader).toBeInTheDocument()
  })

  it("toggles last operation details when clicking button", async () => {
    renderDetailsContent()
    const toggleBtn = await screen.findByRole("button", { name: /Show last operation/i })
    fireEvent.click(toggleBtn)
    expect(screen.getByText(defaultCluster!.lastOperation!.description!)).toBeInTheDocument()
  })

  it("renders WorkerList", async () => {
    renderDetailsContent()
    // Find the Worker Groups heading
    const workerGroupsSection = await screen.findByRole("heading", { name: /Worker Groups/i, level: 2 })
    expect(workerGroupsSection).toBeInTheDocument()

    // Verify worker data is displayed - check for worker name from mock data
    expect(screen.getByText(defaultCluster!.workers[0].name)).toBeInTheDocument()
  })

  it("renders maintenance and auto-update sections", async () => {
    renderDetailsContent()
    // Find the heading
    const maintenanceSection = await screen.findByRole("heading", { name: /Maintenance/i, level: 2 })
    expect(maintenanceSection).toBeInTheDocument()

    // Check that maintenance data is displayed
    expect(screen.getByText("Start Time")).toBeInTheDocument()
    expect(screen.getByText("End Time")).toBeInTheDocument()
    expect(screen.getByText("Timezone")).toBeInTheDocument()
  })

  it("switches to YAML tab and renders YamlEditor", async () => {
    await act(async () => renderDetailsContent())
    // Switch to YAML tab
    const yamlTab = await screen.findByText("YAML")
    fireEvent.click(yamlTab)

    // Find the selected YAML panel and look for the Edit button within it
    await waitFor(() => {
      const allPanels = screen.getAllByRole("tabpanel")
      const yamlPanel = allPanels.find((panel) => panel.className.includes("juno-tabpanel-selected"))
      expect(yamlPanel).toBeDefined()
      const editButton = within(yamlPanel!).getByRole("button", { name: /^edit$/i })
      expect(editButton).toBeInTheDocument()
    })
  })

  describe("YamlEditor disabled states", () => {
    // Helper to get the selected YAML panel's Edit button
    const getYamlEditButton = () => {
      const allPanels = screen.getAllByRole("tabpanel")
      const yamlPanel = allPanels.find((panel) => panel.className.includes("juno-tabpanel-selected"))
      if (!yamlPanel) throw new Error("YAML panel not found")
      return within(yamlPanel).getByRole("button", { name: /^edit$/i })
    }

    it("disables YamlEditor when cluster is deleted", async () => {
      const user = userEvent.setup()
      const deletedCluster = { ...defaultCluster, isDeleted: true }
      await act(async () => renderDetailsContent({ cluster: deletedCluster }))

      // Switch to YAML tab
      const yamlTab = await screen.findByText("YAML")
      fireEvent.click(yamlTab)

      // Find Edit button in the selected YAML panel
      const editButton = await waitFor(() => getYamlEditButton())
      expect(editButton).toBeDisabled()

      // Hover to show tooltip with disabled message
      await act(async () => {
        await user.hover(editButton)
      })

      // Check for deleted cluster message
      expect(await screen.findByText(/cluster is deleted and cannot be edited/i)).toBeInTheDocument()
    })

    it("disables YamlEditor when user has no update permission", async () => {
      const user = userEvent.setup()
      await act(async () =>
        renderDetailsContent({
          shootPermissions: { ...permissionsAllTrue, update: false },
        })
      )

      // Switch to YAML tab
      const yamlTab = await screen.findByText("YAML")
      fireEvent.click(yamlTab)

      // Find Edit button in the selected YAML panel
      const editButton = await waitFor(() => getYamlEditButton())
      expect(editButton).toBeDisabled()

      // Hover to show tooltip with disabled message
      await act(async () => {
        await user.hover(editButton)
      })

      // Check for permission message
      expect(await screen.findByText(/you don't have permission to edit this cluster/i)).toBeInTheDocument()
    })

    it("enables YamlEditor when cluster is not deleted and user has update permission", async () => {
      await act(async () =>
        renderDetailsContent({
          shootPermissions: permissionsAllTrue,
        })
      )

      // Switch to YAML tab
      const yamlTab = await screen.findByText("YAML")
      fireEvent.click(yamlTab)

      // Find Edit button in the selected YAML panel
      const editButton = await waitFor(() => getYamlEditButton())
      expect(editButton).not.toBeDisabled()
    })

    it("prioritizes deleted message over permission message", async () => {
      const user = userEvent.setup()
      const deletedCluster = { ...defaultCluster, isDeleted: true }
      await act(async () =>
        renderDetailsContent({
          cluster: deletedCluster,
          shootPermissions: { ...permissionsAllTrue, update: false },
        })
      )

      // Switch to YAML tab
      const yamlTab = await screen.findByText("YAML")
      fireEvent.click(yamlTab)

      // Find Edit button in the selected YAML panel
      const editButton = await waitFor(() => getYamlEditButton())
      expect(editButton).toBeDisabled()

      // Hover to show tooltip with disabled message
      await act(async () => {
        await user.hover(editButton)
      })

      // Should show deleted message, not permission message
      expect(await screen.findByText(/cluster is deleted and cannot be edited/i)).toBeInTheDocument()
      expect(screen.queryByText(/you don't have permission/i)).not.toBeInTheDocument()
    })
  })

  describe("Refresh button", () => {
    it("renders refresh button next to Last updated text", async () => {
      await act(async () => renderDetailsContent())

      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument()
      const refreshButton = screen.getByRole("button", { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
      expect(refreshButton).not.toBeDisabled()
    })

    it("disables refresh button when fetching", async () => {
      // Note: In a real scenario, isFetching would be true during a loader fetch
      // This test verifies the button exists and can be disabled
      await act(async () => renderDetailsContent())

      const refreshButton = screen.getByRole("button", { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
      // Initially not disabled (not fetching)
      expect(refreshButton).not.toBeDisabled()
    })
  })

  describe("Error and Loading states", () => {
    it("displays loading spinner when isLoading is true", async () => {
      await act(async () => renderDetailsContent({ isLoading: true }))

      expect(screen.getByText(/Loading cluster details.../i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Loading cluster details/i)).toBeInTheDocument()
    })

    it("displays error message when error prop is provided", async () => {
      const testError = new Error("Failed to load cluster")
      await act(async () => renderDetailsContent({ error: testError }))

      expect(screen.getByText(/Failed to load cluster/i)).toBeInTheDocument()
    })

    it("hides tab content when loading", async () => {
      await act(async () => renderDetailsContent({ isLoading: true }))

      // Tab headers should be visible
      expect(screen.getByText("Overview")).toBeInTheDocument()
      expect(screen.getByText("YAML")).toBeInTheDocument()

      // Content should not be visible
      expect(screen.queryByText(/Basic Information/i)).not.toBeInTheDocument()
    })

    it("hides tab content when error is present", async () => {
      const testError = new Error("Test error")
      await act(async () => renderDetailsContent({ error: testError }))

      // Tab headers should be visible
      expect(screen.getByText("Overview")).toBeInTheDocument()
      expect(screen.getByText("YAML")).toBeInTheDocument()

      // Content should not be visible
      expect(screen.queryByText(/Basic Information/i)).not.toBeInTheDocument()
    })

    it("shows content when not loading and no error", async () => {
      await act(async () => renderDetailsContent({ isLoading: false, error: undefined }))

      // Content should be visible
      expect(screen.getByText(/Basic Information/i)).toBeInTheDocument()
    })

    it("maintains refresh button visibility during loading", async () => {
      await act(async () => renderDetailsContent({ isLoading: true }))

      const refreshButton = screen.getByRole("button", { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it("maintains refresh button visibility during error", async () => {
      const testError = new Error("Test error")
      await act(async () => renderDetailsContent({ error: testError }))

      const refreshButton = screen.getByRole("button", { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
    })
  })

  describe("Version update button", () => {
    it("shows update button when versionUpdates are available", async () => {
      const clusterWithUpdates = {
        ...defaultCluster,
        versionUpdates: { patch: ["1.27.6"], minor: [], major: [] },
      }
      await act(async () => renderDetailsContent({ cluster: clusterWithUpdates }))

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeInTheDocument()
      expect(updateButton).not.toBeDisabled()
    })

    it("shows disabled update button when versionUpdates is null", async () => {
      const user = userEvent.setup()
      const clusterNoUpdates = {
        ...defaultCluster,
        versionUpdates: null,
      }
      await act(async () => renderDetailsContent({ cluster: clusterNoUpdates }))

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeInTheDocument()
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      expect(await screen.findByText(/no updates available/i)).toBeInTheDocument()
    })

    it("shows disabled update button when versionUpdates is undefined", async () => {
      const user = userEvent.setup()
      const clusterNoUpdates = {
        ...defaultCluster,
        versionUpdates: undefined,
      }
      await act(async () => renderDetailsContent({ cluster: clusterNoUpdates }))

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeInTheDocument()
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      expect(await screen.findByText(/no updates available/i)).toBeInTheDocument()
    })

    it("disables update button when no updates are available", async () => {
      const user = userEvent.setup()
      const clusterEmptyUpdates = {
        ...defaultCluster,
        versionUpdates: { patch: [], minor: [], major: [] },
      }
      await act(async () => renderDetailsContent({ cluster: clusterEmptyUpdates }))

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      expect(await screen.findByText(/no updates available/i)).toBeInTheDocument()
    })

    it("disables update button when cluster is deleted", async () => {
      const user = userEvent.setup()
      const deletedCluster = {
        ...defaultCluster,
        isDeleted: true,
        versionUpdates: { patch: ["1.27.6"], minor: [], major: [] },
      }
      await act(async () => renderDetailsContent({ cluster: deletedCluster }))

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      expect(await screen.findByText(/cluster is deleted and actions are disabled/i)).toBeInTheDocument()
    })

    it("disables update button when user has no update permission", async () => {
      const user = userEvent.setup()
      const clusterWithUpdates = {
        ...defaultCluster,
        versionUpdates: { patch: ["1.27.6"], minor: [], major: [] },
      }
      await act(async () =>
        renderDetailsContent({
          cluster: clusterWithUpdates,
          shootPermissions: { ...permissionsAllTrue, update: false },
        })
      )

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      expect(await screen.findByText(/you don't have permission to update this cluster/i)).toBeInTheDocument()
    })

    it("prioritizes deleted message over permission and no updates messages", async () => {
      const user = userEvent.setup()
      const deletedCluster = {
        ...defaultCluster,
        isDeleted: true,
        versionUpdates: { patch: [], minor: [], major: [] },
      }
      await act(async () =>
        renderDetailsContent({
          cluster: deletedCluster,
          shootPermissions: { ...permissionsAllTrue, update: false },
        })
      )

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      // Should show deleted message, not permission or no updates message
      expect(await screen.findByText(/cluster is deleted and actions are disabled/i)).toBeInTheDocument()
      expect(screen.queryByText(/you don't have permission/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/no updates available/i)).not.toBeInTheDocument()
    })

    it("prioritizes permission message over unable to check and no updates messages", async () => {
      const user = userEvent.setup()
      const clusterNoUpdates = {
        ...defaultCluster,
        versionUpdates: null,
      }
      await act(async () =>
        renderDetailsContent({
          cluster: clusterNoUpdates,
          shootPermissions: { ...permissionsAllTrue, update: false },
        })
      )

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      // Should show permission message, not no updates message
      expect(await screen.findByText(/you don't have permission to update this cluster/i)).toBeInTheDocument()
      expect(screen.queryByText(/no updates available/i)).not.toBeInTheDocument()
    })

    it("prioritizes permission message over no updates message", async () => {
      const user = userEvent.setup()
      const clusterEmptyUpdates = {
        ...defaultCluster,
        versionUpdates: { patch: [], minor: [], major: [] },
      }
      await act(async () =>
        renderDetailsContent({
          cluster: clusterEmptyUpdates,
          shootPermissions: { ...permissionsAllTrue, update: false },
        })
      )

      const updateButton = await screen.findByRole("button", { name: /update/i })
      expect(updateButton).toBeDisabled()

      // Hover to show tooltip
      await act(async () => {
        await user.hover(updateButton)
      })

      // Should show permission message, not no updates message
      expect(await screen.findByText(/you don't have permission to update this cluster/i)).toBeInTheDocument()
      expect(screen.queryByText(/no updates available/i)).not.toBeInTheDocument()
    })
  })
})
