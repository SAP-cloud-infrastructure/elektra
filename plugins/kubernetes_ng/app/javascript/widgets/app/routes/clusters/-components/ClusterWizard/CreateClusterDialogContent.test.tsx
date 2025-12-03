import React from "react"
import { renderHook, screen, act } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import CreateClusterDialogContent from "./CreateClusterDialogContent"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { DEFAULT_CLUSTER_FORM_DATA } from "./defaults"

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1" formData={DEFAULT_CLUSTER_FORM_DATA}>
          <CreateClusterDialogContent />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("CreateClusterDialogContent", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders Step1 when currentStep is 0", async () => {
    const wrapper = TestWrapper(queryClient)

    const { result } = renderHook(() => useWizard(), { wrapper })

    await act(async () => {
      await result.current.handleSetCurrentStep(0)
    })

    const title = await screen.findByText(/Basic Information/i, { selector: "h1" })
    expect(title).toBeInTheDocument()

    expect(screen.getByRole("button", { name: /Basic Info/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Worker Groups/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Summary/i })).toBeInTheDocument()
  })

  it("renders Step2 when currentStep is 1", async () => {
    const wrapper = TestWrapper(queryClient)

    const { result } = renderHook(() => useWizard(), { wrapper })

    await act(async () => {
      await result.current.handleSetCurrentStep(1)
    })

    const title = await screen.findByText(/Worker Group:/i, { selector: "h1" })
    expect(title).toBeInTheDocument()

    expect(screen.getByRole("button", { name: /Basic Info/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Worker Groups/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Summary/i })).toBeInTheDocument()
  })

  it("renders Summary when currentStep is 2", async () => {
    const wrapper = TestWrapper(queryClient)

    const { result } = renderHook(() => useWizard(), { wrapper })

    await act(async () => {
      await result.current.handleSetCurrentStep(2)
    })

    const title = await screen.findByText(/Summary/i, { selector: "h1" })
    expect(title).toBeInTheDocument()

    //Progress should still be visible
    expect(screen.getByRole("button", { name: /Basic Info/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Worker Groups/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Summary/i })).toBeInTheDocument()
  })
})
