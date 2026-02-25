import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react"
import DetailsContent from "./DetailsContent"
import { defaultCluster } from "../../../../mocks/data"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, createMemoryHistory, createRootRoute, createRoute, RouterProvider } from "@tanstack/react-router"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"

// Helper to render DetailsContent with QueryClientProvider
const renderDetailsContent = ({ cluster = defaultCluster, updatedAt = Date.now(), ...props } = {}) => {
  let queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const rootRoute = createRootRoute({
    component: () => <DetailsContent cluster={cluster} updatedAt={updatedAt} {...props} />,
  })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    context: { defaultMockClient },
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
})
