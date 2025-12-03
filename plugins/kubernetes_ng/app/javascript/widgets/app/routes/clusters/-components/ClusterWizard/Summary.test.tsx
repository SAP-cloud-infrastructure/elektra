import React from "react"
import { renderHook, screen, within } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import * as wizardHook from "./WizzardProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import Summary from "./Summary"
import { validClusterFormData } from "../../../../mocks/data"
import { DEFAULT_CLUSTER_FORM_DATA } from "./defaults"

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1" formData={DEFAULT_CLUSTER_FORM_DATA}>
          <Summary />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

function expectFieldErrorWithinSection(section: HTMLElement, label: string) {
  const cell = within(section).getByText(label).closest("div[role='columnheader']") as HTMLElement
  expect(cell).toHaveClass("tw-text-theme-danger")
  expect(within(cell).getByRole("img", { name: /cancel/i })).toBeInTheDocument()
}

describe("Summary Component", () => {
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

  it("renders basic cluster info", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        clusterFormData: validClusterFormData,
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const basicInfoSection = screen.getByRole("region", { name: /basic info/i })
    expect(basicInfoSection).toBeInTheDocument()

    const { getByText } = within(basicInfoSection)
    const title = getByText("Basic Info")
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe("H1")

    expect(getByText("Name")).toBeInTheDocument()
    expect(getByText(validClusterFormData.name)).toBeInTheDocument()
    expect(getByText("Cloud Profile")).toBeInTheDocument()
    expect(getByText(validClusterFormData.cloudProfileName)).toBeInTheDocument()
    expect(getByText("Kubernetes Version")).toBeInTheDocument()
    expect(getByText(validClusterFormData.kubernetesVersion)).toBeInTheDocument()
  })

  it("renders basic cluster info with errors", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        formErrors: {
          name: ["Name is required."],
          cloudProfileName: ["Cloud Profile is required."],
          kubernetesVersion: ["Kubernetes Version is required."],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const basicInfoSection = screen.getByRole("region", { name: /basic info/i })
    expect(basicInfoSection).toBeInTheDocument()

    expectFieldErrorWithinSection(basicInfoSection, "Name")
    expectFieldErrorWithinSection(basicInfoSection, "Cloud Profile")
    expectFieldErrorWithinSection(basicInfoSection, "Kubernetes Version")
  })

  it("renders infrastructure info", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        clusterFormData: validClusterFormData,
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const infraSection = screen.getByRole("region", { name: /infrastructure/i })
    expect(infraSection).toBeInTheDocument()

    const { getByText } = within(infraSection)
    const title = getByText("Infrastructure")
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe("H1")

    expect(getByText("Floating IP Pool")).toBeInTheDocument()
    expect(getByText(validClusterFormData.infrastructure.floatingPoolName)).toBeInTheDocument()
    expect(getByText("Pods CIDR")).toBeInTheDocument()
    expect(getByText(validClusterFormData.networking!.podsCIDR!)).toBeInTheDocument()
    expect(getByText("Nodes CIDR")).toBeInTheDocument()
    expect(getByText(validClusterFormData.networking!.nodesCIDR!)).toBeInTheDocument()
    expect(getByText("Services CIDR")).toBeInTheDocument()
    expect(getByText(validClusterFormData.networking!.servicesCIDR!)).toBeInTheDocument()
  })

  it("renders infrastructure info with errors", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        formErrors: {
          "infrastructure.floatingPoolName": ["Floating IP Pool is required."],
          "networking.podsCIDR": ["Pods CIDR is invalid."],
          "networking.nodesCIDR": ["Nodes CIDR is invalid."],
          "networking.servicesCIDR": ["Services CIDR is invalid."],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const basicInfoSection = screen.getByRole("region", { name: /infrastructure/i })
    expect(basicInfoSection).toBeInTheDocument()

    expectFieldErrorWithinSection(basicInfoSection, "Floating IP Pool")
    expectFieldErrorWithinSection(basicInfoSection, "Pods CIDR")
    expectFieldErrorWithinSection(basicInfoSection, "Nodes CIDR")
    expectFieldErrorWithinSection(basicInfoSection, "Services CIDR")
  })

  it("renders worker groups info", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        clusterFormData: validClusterFormData,
      }
    })

    renderHook(() => useWizard(), { wrapper })

    validClusterFormData.workers.forEach((wg) => {
      const wgSection = screen.getByRole("region", { name: new RegExp(`worker group ${wg.name}`, "i") })
      expect(wgSection).toBeInTheDocument()

      const { getByText } = within(wgSection)
      const title = getByText(new RegExp(`Worker Group ${wg.name}`, "i"))
      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe("H1")

      expect(getByText("Name")).toBeInTheDocument()
      expect(getByText(wg.name)).toBeInTheDocument()
      expect(getByText("Machine Type")).toBeInTheDocument()
      expect(getByText(wg.machineType)).toBeInTheDocument()
      expect(getByText("Machine Image")).toBeInTheDocument()
      expect(getByText(wg.machineImage.name)).toBeInTheDocument()
      expect(getByText("Image Version")).toBeInTheDocument()
      expect(getByText(wg.machineImage.version)).toBeInTheDocument()
      expect(getByText("Minimum Nodes")).toBeInTheDocument()
      expect(getByText(wg.minimum.toString())).toBeInTheDocument()
      expect(getByText("Maximum Nodes")).toBeInTheDocument()
      expect(getByText(wg.maximum.toString())).toBeInTheDocument()
      expect(getByText("Availability Zones")).toBeInTheDocument()
      wg.zones.forEach((zone) => {
        expect(getByText(zone)).toBeInTheDocument()
      })
    })
  })

  it("renders worker groups info with errors", () => {
    const wrapper = TestWrapper(queryClient)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        clusterFormData: validClusterFormData,
        formErrors: {
          [`workers.${validClusterFormData.workers[0].id}.name`]: ["Name is required."],
          [`workers.${validClusterFormData.workers[0].id}.machineType`]: ["Machine Type is required."],
          [`workers.${validClusterFormData.workers[0].id}.machineImage.name`]: ["Machine Image is required."],
          [`workers.${validClusterFormData.workers[0].id}.machineImage.version`]: ["Image Version is required."],
          [`workers.${validClusterFormData.workers[0].id}.minimum`]: ["Minimum Nodes are required."],
          [`workers.${validClusterFormData.workers[0].id}.maximum`]: ["Maximum Nodes are required."],
          [`workers.${validClusterFormData.workers[0].id}.zones`]: ["At least one Availability Zone is required."],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const wg = validClusterFormData.workers[0]
    const wgSection = screen.getByRole("region", { name: new RegExp(`worker group ${wg.name}`, "i") })
    expect(wgSection).toBeInTheDocument()

    expectFieldErrorWithinSection(wgSection, "Name")
    expectFieldErrorWithinSection(wgSection, "Machine Type")
    expectFieldErrorWithinSection(wgSection, "Machine Image")
    expectFieldErrorWithinSection(wgSection, "Image Version")
    expectFieldErrorWithinSection(wgSection, "Minimum Nodes")
    expectFieldErrorWithinSection(wgSection, "Maximum Nodes")
    expectFieldErrorWithinSection(wgSection, "Availability Zones")
  })
})
