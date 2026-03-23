import React from "react"
import { renderHook, screen } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import * as wizardHook from "./WizzardProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import Step2 from "./Step2"
import { DEFAULT_WORKER_GROUP, DEFAULT_CLUSTER_FORM_DATA } from "./defaults"

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1" formData={DEFAULT_CLUSTER_FORM_DATA}>
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

  it("renders WorkerGroupEditor component", () => {
    const wrapper = TestWrapper(queryClient)
    renderHook(() => useWizard(), { wrapper })

    expect(screen.getByText("Node Auto-scaling")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Add Worker Group/i })).toBeInTheDocument()
  })

  it("passes workers from wizard context to WorkerGroupEditor", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard
    const worker = { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker-test1" }

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

  it("passes cloud profile data to WorkerGroupEditor", () => {
    const wrapper = TestWrapper(queryClient)
    renderHook(() => useWizard(), { wrapper })

    // WorkerGroupEditor should render with machine type select
    const section = screen.getByRole("region", { name: /worker1/i })
    expect(section).toBeInTheDocument()
  })

  it("passes form errors to WorkerGroupEditor", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard
    const workerId = "worker-test-id"

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        clusterFormData: {
          ...original.clusterFormData,
          workers: [{ ...DEFAULT_WORKER_GROUP, id: workerId, name: "worker1" }],
        },
        formErrors: {
          [`workers.${workerId}.name`]: ["Name is required"],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })
    expect(screen.getByText("Name is required")).toBeInTheDocument()
  })
})
