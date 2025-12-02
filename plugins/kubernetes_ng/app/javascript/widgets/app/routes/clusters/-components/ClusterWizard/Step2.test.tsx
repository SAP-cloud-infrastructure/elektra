import React from "react"
import { renderHook, screen, act, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DEFAULT_WORKER_GROUP, WizardProvider, useWizard } from "./WizzardProvider"
import * as wizardHook from "./WizzardProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import Step2 from "./Step2"

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1">
          <Step2 />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("Step2 Component", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.restoreAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders initial 1 worker group", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard
    const worker = { ...DEFAULT_WORKER_GROUP, name: "worker-test1" }

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        clusterFormData: {
          ...original.clusterFormData,
          workers: [worker],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })
    expect(screen.getByText((content) => content.includes(worker.name))).toBeInTheDocument()
  })

  it("adds a new worker group", async () => {
    const wrapper = TestWrapper(queryClient)
    renderHook(() => useWizard(), { wrapper })

    const addButton = screen.getByRole("button", { name: /Add Worker Group/i })
    await act(async () => {
      userEvent.click(addButton)
    })

    expect(screen.getByText((content) => content.includes("worker1"))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes("worker2"))).toBeInTheDocument()
  })

  it("doesn't allow to delete the first worker group", async () => {
    const wrapper = TestWrapper(queryClient)
    renderHook(() => useWizard(), { wrapper })

    const addButton = screen.getByRole("button", { name: /Add Worker Group/i })
    await act(async () => {
      userEvent.click(addButton)
    })

    const deleteButton = screen.queryByLabelText("Delete Worker Group worker1")
    expect(deleteButton).toBeNull()
  })

  it("deletes a worker group", async () => {
    const wrapper = TestWrapper(queryClient)
    renderHook(() => useWizard(), { wrapper })

    const addButton = screen.getByRole("button", { name: /Add Worker Group/i })
    await act(async () => {
      userEvent.click(addButton)
    })

    expect(screen.getByText((content) => content.includes("worker1"))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes("worker2"))).toBeInTheDocument()

    const deleteButton = screen.getByLabelText("Delete Worker Group worker2")

    await act(async () => {
      userEvent.click(deleteButton)
    })

    await waitFor(() => {
      expect(screen.queryByText(/worker2/)).not.toBeInTheDocument()
    })
  })
})
