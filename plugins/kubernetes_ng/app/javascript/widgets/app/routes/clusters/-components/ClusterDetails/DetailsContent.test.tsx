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

// Helper to render DetailsContent with QueryClientProvider
const renderDetailsContent = ({
  cluster = defaultCluster,
  updatedAt = Date.now(),
  shootPermissions = permissionsAllTrue,
  ...props
} = {}) => {
  let queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute({
    component: () => <DetailsContent cluster={cluster} updatedAt={updatedAt} shootPermissions={shootPermissions} {...props} />,
  })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    context: { apiClient: defaultMockClient },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MessagesProvider>
        <RouterProvider router={router} />
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
    // Find the heading
    const workerGroupsSection = await screen.findByRole("heading", { name: /Worker Groups/i, level: 2 })
    expect(workerGroupsSection).toBeInTheDocument()
    // Scope queries to the container under the heading
    const sectionContainer = workerGroupsSection.parentElement!
    const { getByRole } = within(sectionContainer)
    // Find a grid role
    const workersGrid = getByRole("grid")
    expect(workersGrid).toBeInTheDocument()
  })

  it("renders maintenance and auto-update sections", async () => {
    renderDetailsContent()
    // Find the heading
    const maintenanceWindowSection = await screen.findByRole("heading", { name: /Maintenance Window/i, level: 2 })
    expect(maintenanceWindowSection).toBeInTheDocument()
    const sectionContainer = maintenanceWindowSection.parentElement!
    const { getByRole } = within(sectionContainer)
    // Find a grid role
    const maintenanceGrid = getByRole("grid")
    expect(maintenanceGrid).toBeInTheDocument()
  })

  it("switches to YAML tab and renders YamlEditor", async () => {
    renderDetailsContent()
    const yamlTab = await screen.findByText("YAML")
    fireEvent.click(yamlTab)
    // Expect YamlEditor to be in the document - look for the Edit button
    const editButton = await screen.findByRole("button", { name: /edit/i })
    expect(editButton).toBeInTheDocument()
  })

  describe("YamlEditor disabled states", () => {
    it("disables YamlEditor when cluster is deleted", async () => {
      const user = userEvent.setup()
      const deletedCluster = { ...defaultCluster, isDeleted: true }
      await act(async () => renderDetailsContent({ cluster: deletedCluster }))

      // Switch to YAML tab
      const yamlTab = await screen.findByText("YAML")
      fireEvent.click(yamlTab)

      // Find Edit button
      const editButton = await screen.findByRole("button", { name: /edit/i })
      expect(editButton).toBeDisabled()

      // Hover to show tooltip with disabled message
      act(() => {
        user.hover(editButton)
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

      // Find Edit button
      const editButton = await screen.findByRole("button", { name: /edit/i })
      expect(editButton).toBeDisabled()

      // Hover to show tooltip with disabled message
      act(() => {
        user.hover(editButton)
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

      // Find Edit button
      const editButton = await screen.findByRole("button", { name: /edit/i })
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

      // Find Edit button
      const editButton = await screen.findByRole("button", { name: /edit/i })
      expect(editButton).toBeDisabled()

      // Hover to show tooltip with disabled message
      act(() => {
        user.hover(editButton)
      })

      // Should show deleted message, not permission message
      expect(await screen.findByText(/cluster is deleted and cannot be edited/i)).toBeInTheDocument()
      expect(screen.queryByText(/you don't have permission/i)).not.toBeInTheDocument()
    })
  })
})
