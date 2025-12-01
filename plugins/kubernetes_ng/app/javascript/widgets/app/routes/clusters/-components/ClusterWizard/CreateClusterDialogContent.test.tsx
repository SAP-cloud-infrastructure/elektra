import React from "react"
import { renderHook, screen, act } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import CreateClusterDialogContent from "./CreateClusterDialogContent"
import { defaultCluster, permissionsAllTrue, externalNetworks, cloudProfiles } from "../../../../mocks/data"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi } from "vitest"
import { PortalProvider } from "@cloudoperators/juno-ui-components"

const mockClient = {
  gardener: {
    getClusters: () => Promise.resolve([defaultCluster]),
    getClusterByName: () => Promise.resolve(defaultCluster),
    createCluster: () => Promise.resolve(defaultCluster),

    getPermissions: () => Promise.resolve(permissionsAllTrue),

    getExternalNetworks: () => Promise.resolve(externalNetworks),
    getCloudProfiles: () => Promise.resolve(cloudProfiles),
  },
}

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={mockClient} region="us-east-1">
          <CreateClusterDialogContent />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("CreateClusterDialogContent", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.resetAllMocks()
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
