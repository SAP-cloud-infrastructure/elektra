import React from "react"
import { renderHook, screen, fireEvent } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import * as wizardHook from "./WizzardProvider"
import { QueryClient, QueryClientProvider, UseQueryResult } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import Step1 from "./Step1"
import { CloudProfile } from "../../../../types/cloudProfiles"
import { DEFAULT_CLUSTER_FORM_DATA } from "./defaults"
import { GardenerApi } from "../../../../apiClient"

const TestWrapper =
  (queryClient: QueryClient, client: GardenerApi = defaultMockClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={client} region="us-east-1" formData={DEFAULT_CLUSTER_FORM_DATA}>
          <Step1 />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("Step1 Component", () => {
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders basic and infrastructure sections", async () => {
    const wrapper = TestWrapper(queryClient)

    renderHook(() => useWizard(), { wrapper })

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cloud Profile/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Kubernetes Version/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Floating IP Pool/i)).toBeInTheDocument()
  })

  it("toggles advanced network inputs via button", async () => {
    const wrapper = TestWrapper(queryClient)

    renderHook(() => useWizard(), { wrapper })

    const toggleButton = screen.getByRole("button", { name: /advanced network options/i })
    expect(toggleButton).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute("aria-expanded", "true")
  })

  it("auto-opens advanced network section if network errors exist", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        formErrors: {
          "networking.pods": ["Invalid CIDR"],
          "networking.nodes": ["Invalid CIDR"],
          "networking.services": ["Invalid CIDR"],
          "infrastructure.networkWorkers": ["Invalid CIDR"],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const toggleButton = screen.getByRole("button", { name: /advanced network options/i })
    expect(toggleButton).toHaveAttribute("aria-expanded", "true")
  })

  it("disables Cloud Profile and Kubernetes Version selects when loading", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        cloudProfiles: {
          isLoading: true,
          status: "loading",
          isFetching: true,
        } as unknown as UseQueryResult<CloudProfile[], Error>,
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const cloudSelect = screen.getByLabelText("Cloud Profile")
    const kubeSelect = screen.getByLabelText("Kubernetes Version")

    expect(cloudSelect).toBeDisabled()
    expect(kubeSelect).toBeDisabled()
  })

  it("displays errors for all fields", async () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        formErrors: {
          name: ["Name is required"],
          cloudProfileName: ["Cloud Profile is required"],
          kubernetesVersion: ["Kubernetes Version is required"],
          "infrastructure.floatingPoolName": ["Floating IP Pool is required"],
          "networking.pods": ["Invalid CIDR"],
          "networking.nodes": ["Invalid CIDR"],
          "networking.services": ["Invalid CIDR"],
          "infrastructure.networkWorkers": ["Invalid CIDR"],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })
    expect(screen.getByText("Name is required")).toBeInTheDocument()
    expect(await screen.findByText("Cloud Profile is required")).toBeInTheDocument()
    expect(screen.getByText("Kubernetes Version is required")).toBeInTheDocument()
    expect(screen.getByText("Floating IP Pool is required")).toBeInTheDocument()
    expect(screen.getAllByText("Invalid CIDR").length).toBe(4)
  })

  test("validates on blur", async () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard
    const validateSingleField = vi.fn()

    const textFields = [
      { label: "Name", key: "name" },
      { label: "Pods CIDR", key: "networking.pods" },
      { label: "Nodes CIDR", key: "networking.nodes" },
      { label: "Services CIDR", key: "networking.services" },
      { label: "Workers CIDR", key: "infrastructure.networkWorkers" },
    ]

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        validateSingleField: validateSingleField,
      }
    })

    renderHook(() => useWizard(), { wrapper })

    textFields.forEach(({ label, key }) => {
      const input = screen.getByLabelText(label)
      fireEvent.change(input, { target: { value: "test" } })
      fireEvent.blur(input)
      expect(validateSingleField).toHaveBeenCalledWith(key)
    })
  })
})
