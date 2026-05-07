import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom"
import MaintenanceWindowEditModal from "./MaintenanceWindowEditModal"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import type { Maintenance, AutoUpdate } from "../../../../types/cluster"

const mockMaintenance: Maintenance = {
  startTime: "22:00",
  endTime: "23:00",
  timezone: "+01:00",
}

const mockAutoUpdate: AutoUpdate = {
  os: true,
  kubernetes: true,
}

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

describe("MaintenanceWindowEditModal", () => {
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

  it("renders modal with maintenance data", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })

    // Check if form fields are populated with initial data
    // DateTimePicker with enableTime and noCalendar shows time in H:i format
    await waitFor(() => {
      const timeInput = screen.getByLabelText(/Start Time/i)
      expect(timeInput).toHaveValue("22:00")
    })

    // Check timezone input
    const timezoneInput = screen.getByLabelText(/Timezone/i)
    expect(timezoneInput).toHaveValue("+01:00")
  })

  it("shows auto-update OS checkbox when cluster has workers", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Auto-update Operating System")).toBeInTheDocument()
    })
  })

  it("hides auto-update OS checkbox when cluster has no workers", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={false}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })

    expect(screen.queryByText("Auto-update Operating System")).not.toBeInTheDocument()
  })

  it("disables save button when no changes are made", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })

    const saveButton = screen.getByRole("button", { name: /Save Changes/i })
    expect(saveButton).toBeDisabled()
  })

  it("enables save button when changes are made", async () => {
    const user = userEvent.setup()
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })

    const saveButton = screen.getByRole("button", { name: /Save Changes/i })
    expect(saveButton).toBeDisabled()

    // Toggle kubernetes auto-update checkbox to trigger a change
    const kubernetesCheckbox = screen.getByLabelText(/Auto-update Kubernetes Version/i)
    await act(async () => {
      await user.click(kubernetesCheckbox)
    })

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
  })

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn()
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={onCancel}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    await act(async () => {
      cancelButton.click()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("shows validation error for invalid timezone format", async () => {
    const user = userEvent.setup()
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })

    // Enter invalid timezone
    const timezoneInput = screen.getByLabelText(/Timezone/i)
    // Trigger blur event to validate
    await act(async () => {
      await user.clear(timezoneInput)
      await user.type(timezoneInput, "invalid")
      timezoneInput.blur()
    })

    await waitFor(() => {
      expect(screen.getByText(/Invalid timezone format/i)).toBeInTheDocument()
    })
  })

  it("shows validation error for duration out of range", async () => {
    const user = userEvent.setup()
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )
    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })
    // Enter duration below minimum (30 minutes)
    const durationInput = screen.getByLabelText(/Duration/i)
    // Trigger blur event to validate
    await act(async () => {
      await user.clear(durationInput)
      await user.type(durationInput, "20")
      await durationInput.blur()
    })
    await waitFor(() => {
      expect(screen.getByText(/Duration must be at least 30 minutes/i)).toBeInTheDocument()
    })
  })

  it("shows error message when mutation fails", async () => {
    // Suppress console.error for this test since we expect an error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const user = userEvent.setup()
    const mockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        updateCluster: vi.fn().mockRejectedValue(new Error("Update failed")),
      },
    }
    const wrapper = TestWrapper(queryClient, mockClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )
    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })
    // Change timezone to enable save button
    const timezoneInput = screen.getByLabelText(/Timezone/i)
    await act(async () => {
      await user.clear(timezoneInput)
      await user.type(timezoneInput, "+02:00")
    })
    const saveButton = screen.getByRole("button", { name: /Save Changes/i })
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
    await act(async () => {
      saveButton.click()
    })
    await waitFor(() => {
      expect(screen.getByText(/Error:.*Update failed/i)).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it("keeps modal open when mutation fails", async () => {
    // Suppress console.error for this test since we expect an error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const mockClient = {
      ...defaultMockClient,
      gardener: {
        ...defaultMockClient.gardener,
        updateCluster: vi.fn().mockRejectedValue(new Error("Update failed")),
      },
    }
    const wrapper = TestWrapper(queryClient, mockClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={mockAutoUpdate}
        hasWorkers={true}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )
    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })
    // Change timezone
    const timezoneInput = screen.getByLabelText(/Timezone/i)
    await act(async () => {
      await user.clear(timezoneInput)
      await user.type(timezoneInput, "+02:00")
    })
    const saveButton = screen.getByRole("button", { name: /Save Changes/i })
    await act(async () => {
      saveButton.click()
    })
    await waitFor(() => {
      expect(screen.getByText(/Error:.*Update failed/i)).toBeInTheDocument()
    })
    // Modal should still be visible
    expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    // onSuccess should not have been called
    expect(onSuccess).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it("shows both kubernetes and os auto-update checkboxes checked by default", async () => {
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={{ os: true, kubernetes: true }}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )
    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })
    const kubernetesCheckbox = screen.getByLabelText(/Auto-update Kubernetes Version/i)
    const osCheckbox = screen.getByLabelText(/Auto-update Operating System/i)
    expect(kubernetesCheckbox).toBeChecked()
    expect(osCheckbox).toBeChecked()
  })

  it("allows toggling auto-update checkboxes", async () => {
    const user = userEvent.setup()
    const wrapper = TestWrapper(queryClient)
    render(
      <MaintenanceWindowEditModal
        clusterName="test-cluster"
        maintenance={mockMaintenance}
        autoUpdate={{ os: true, kubernetes: true }}
        hasWorkers={true}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper }
    )
    await waitFor(() => {
      expect(screen.getByText("Edit Maintenance Window")).toBeInTheDocument()
    })
    const kubernetesCheckbox = screen.getByLabelText(/Auto-update Kubernetes Version/i)
    await act(async () => {
      await user.click(kubernetesCheckbox)
    })
    await waitFor(() => {
      expect(kubernetesCheckbox).not.toBeChecked()
    })
  })
})
