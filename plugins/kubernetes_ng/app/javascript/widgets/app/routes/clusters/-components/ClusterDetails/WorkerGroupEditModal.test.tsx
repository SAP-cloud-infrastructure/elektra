import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom"
import WorkerGroupEditModal from "./WorkerGroupEditModal"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { Worker } from "../../../../types/cluster"
import { worker1 } from "../../../../mocks/data"

const existingWorkers: Worker[] = [worker1]

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
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </PortalProvider>
    )
  }

describe("WorkerGroupEditModal", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders modal with existing workers", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })
    expect(screen.getByText(new RegExp(worker1.name, "i"))).toBeInTheDocument()
  })

  it("disables save button when existing worker is complete but new worker is incomplete", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })

    // Initially, save button should be disabled (no changes made yet)
    const saveButton = screen.getByRole("button", { name: /Save Changes/i })
    expect(saveButton).toBeDisabled()

    // Add a new worker group
    const addButton = screen.getByRole("button", { name: /Add Worker Group/i })
    act(() => {
      addButton.click()
    })

    // Now save button should still be disabled because new worker is incomplete
    await waitFor(() => {
      expect(saveButton).toBeDisabled()
    })
  })

  it("keeps save button disabled while new worker is incomplete", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })

    const saveButton = screen.getByRole("button", { name: /Save Changes/i })
    // Should be disabled initially (no changes)
    expect(saveButton).toBeDisabled()

    // Add a new worker group
    const addButton = screen.getByRole("button", { name: /Add Worker Group/i })
    act(() => {
      addButton.click()
    })

    // Save button should still be disabled
    await waitFor(() => {
      expect(saveButton).toBeDisabled()
    })

    // Find the new worker section (it will have a random name like "worker-xxxxx")
    const workerSections = await screen.findAllByRole("region")
    const newWorkerSection = workerSections[workerSections.length - 1]

    // Partially fill in the new worker (just the name)
    const nameInput = newWorkerSection.querySelector('input[type="text"]') as HTMLInputElement
    act(() => {
      nameInput.value = "worker2"
    })

    // Button should still be disabled because other required fields are incomplete
    expect(saveButton).toBeDisabled()
  })

  it("shows description", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText(/Configure the worker nodes for your cluster/i)).toBeInTheDocument()
    })
  })

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn()
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    act(() => {
      cancelButton.click()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("allows editing all worker fields", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })

    const workerSection = await screen.findByRole("region", { name: new RegExp(worker1.name, "i") })
    const nameInput = workerSection.querySelector('input[type="text"]') as HTMLInputElement

    // All fields should be editable
    expect(nameInput).not.toBeDisabled()
  })

  it("disables save button while cloud profile data is loading", async () => {
    // Create a mock client where getCloudProfiles returns a never-resolving promise
    const loadingMockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        getCloudProfiles: () => new Promise<never>(() => {}), // Never resolves, simulating loading state
      },
    }

    const wrapper = TestWrapper(queryClient, loadingMockClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })

    const saveButton = screen.getByRole("button", { name: /Save Changes/i })

    // Save button should be disabled while loading, even though existing worker is complete
    expect(saveButton).toBeDisabled()
  })

  it("disables save button when no changes are made", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <WorkerGroupEditModal
        open={true}
        clusterName="test-cluster"
        workers={existingWorkers}
        cloudProfileName="openstack"
        region="eu-de-1"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Worker Groups")).toBeInTheDocument()
    })

    const saveButton = screen.getByRole("button", { name: /Save Changes/i })

    // Save button should be disabled when no changes have been made
    expect(saveButton).toBeDisabled()
  })
})
