import React from "react"
import { renderHook, act, waitFor } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { validClusterFormData, cloudProfiles } from "../../../../mocks/data"
import { DEFAULT_CLUSTER_FORM_DATA } from "./defaults"

const TestWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1" formData={DEFAULT_CLUSTER_FORM_DATA}>
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("WizardProvider / useWizard", () => {
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

  it("provides default cluster form data", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })
    expect(result.current.clusterFormData).toEqual(DEFAULT_CLUSTER_FORM_DATA)
  })

  it("updates cluster form data via setClusterFormData", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })
    act(() => {
      result.current.setClusterFormData((prev) => ({ ...prev, name: "my-cluster" }))
    })
    expect(result.current.clusterFormData.name).toBe("my-cluster")
  })

  it("validates a single field", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })
    act(() => {
      result.current.validateSingleField("name")
    })
    expect(result.current.formErrors.name.length).toBeGreaterThan(0)
  })

  it("updates cloud profile and resets workers", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })

    const newData = result.current.updateCloudProfile(DEFAULT_CLUSTER_FORM_DATA, cloudProfiles[0].name, cloudProfiles)
    expect(newData.cloudProfileName).toBe(cloudProfiles[0].name)
    expect(newData.workers[0].machineType).toBe("")
    expect(newData.workers[0].machineImage).toEqual({ name: "", version: "" })
    expect(newData.workers[0].zones).toEqual([])
  })

  it("updates networking field correctly", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })

    const updated = result.current.updateNetworkingField(DEFAULT_CLUSTER_FORM_DATA, "podsCIDR", "10.0.0.0/16")
    expect(updated.networking?.podsCIDR).toBe("10.0.0.0/16")
  })

  it("removes networking field when value is empty", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })

    const withNetworking: typeof DEFAULT_CLUSTER_FORM_DATA = {
      ...DEFAULT_CLUSTER_FORM_DATA,
      networking: {
        podsCIDR: "10.0.0.0/16",
        nodesCIDR: "10.0.1.0/16",
        servicesCIDR: "10.0.1.0/16",
      },
    }

    const updated = result.current.updateNetworkingField(withNetworking, "podsCIDR", "")
    expect(updated.networking?.podsCIDR).toBeUndefined()
    expect(updated.networking?.nodesCIDR).toBe("10.0.1.0/16")
    expect(updated.networking?.servicesCIDR).toBe("10.0.1.0/16")
  })

  it("removes entire networking when all fields are empty", () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })

    const withNetworking: typeof DEFAULT_CLUSTER_FORM_DATA = {
      ...DEFAULT_CLUSTER_FORM_DATA,
      networking: {
        podsCIDR: "10.0.0.0/16",
        nodesCIDR: "10.0.1.0/16",
        servicesCIDR: "10.0.1.0/16",
      },
    }

    let updated = result.current.updateNetworkingField(withNetworking, "podsCIDR", "")
    updated = result.current.updateNetworkingField(updated, "nodesCIDR", "")
    updated = result.current.updateNetworkingField(updated, "servicesCIDR", "")
    expect(updated.networking).toBeUndefined()
  })

  it("sets default cloudProfileName and kubernetesVersion from fetched profiles", async () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })

    // wait for the cloudProfiles query to resolve
    await waitFor(() => {
      expect(result.current.cloudProfiles.data).toBeDefined()
    })

    // check that the default cloud profile is selected
    expect(result.current.clusterFormData.cloudProfileName).toBe(cloudProfiles[0].name)
    expect(result.current.clusterFormData.kubernetesVersion).toBe(cloudProfiles[0].kubernetesVersions[0]) // latest version
  })

  it("sets default floatingPoolName from fetched external networks", async () => {
    const wrapper = TestWrapper(queryClient)
    const { result } = renderHook(() => useWizard(), { wrapper })

    // wait for the externalNetworks query to resolve
    await waitFor(() => {
      expect(result.current.extNetworks.data).toBeDefined()
    })

    // check that the default floating pool is selected
    expect(result.current.clusterFormData.infrastructure.floatingPoolName).toBe(
      result.current.extNetworks.data?.[0].name
    )
  })

  describe("handleSetCurrentStep", () => {
    it("initializes with step 0 and no errors", () => {
      const wrapper = TestWrapper(queryClient)
      const { result } = renderHook(() => useWizard(), { wrapper })

      expect(result.current.currentStep).toBe(0)
      expect(result.current.maxStepReached).toBe(0)
      expect(result.current.formErrors).toEqual({})
      expect(result.current.steps.every((s) => s.hasError === false)).toBe(true)
    })

    it("updates currentStep and maxStepReached when advancing", () => {
      const wrapper = TestWrapper(queryClient)
      const { result } = renderHook(() => useWizard(), { wrapper })

      act(() => {
        result.current.handleSetCurrentStep(1)
      })

      expect(result.current.currentStep).toBe(1)
      expect(result.current.maxStepReached).toBe(1)
    })

    it("does not decrease maxStepReached when going backward", () => {
      const wrapper = TestWrapper(queryClient)
      const { result } = renderHook(() => useWizard(), { wrapper })

      act(() => {
        result.current.handleSetCurrentStep(2)
      })
      expect(result.current.maxStepReached).toBe(2)

      act(() => {
        result.current.handleSetCurrentStep(1)
      })
      expect(result.current.maxStepReached).toBe(2)
      expect(result.current.currentStep).toBe(1)
    })

    it("validates all steps up to maxStepReached and updates formErrors", () => {
      const wrapper = TestWrapper(queryClient)
      const { result } = renderHook(() => useWizard(), { wrapper })

      // initially, clusterFormData.name is empty → should trigger error in step1
      act(() => {
        result.current.handleSetCurrentStep(1)
      })

      // step 0 = step1, hasError should be true
      expect(result.current.steps[0].hasError).toBe(true)

      // formErrors contains errors for required fields
      expect(result.current.formErrors.name).toContain("This field is required")
    })

    it("updates multiple steps errors correctly", () => {
      const wrapper = TestWrapper(queryClient)
      const { result } = renderHook(() => useWizard(), { wrapper })

      // fill in clusterFormData partially to create errors in both step1 and step2
      act(() => {
        result.current.setClusterFormData({
          ...DEFAULT_CLUSTER_FORM_DATA,
          name: "", // missing → step1 error
          workers: [
            {
              ...DEFAULT_CLUSTER_FORM_DATA.workers[0],
              name: "", // missing → step2 error
              machineType: "",
              machineImage: { name: "", version: "" },
              minimum: 0,
              maximum: 0,
              zones: [],
            },
          ],
        })
      })

      act(() => {
        result.current.handleSetCurrentStep(2) // validate steps 0 & 1
      })

      expect(result.current.steps[0].hasError).toBe(true)
      expect(result.current.steps[1].hasError).toBe(true)

      expect(result.current.formErrors.name).toContain("This field is required")
      expect(result.current.formErrors["workers." + DEFAULT_CLUSTER_FORM_DATA.workers[0].id + ".name"]).toContain(
        "Name is required"
      )
    })

    it("clears step errors if fields are valid", () => {
      const wrapper = TestWrapper(queryClient)
      const { result } = renderHook(() => useWizard(), { wrapper })

      act(() => {
        result.current.setClusterFormData(validClusterFormData)
      })

      act(() => {
        result.current.handleSetCurrentStep(1)
      })

      expect(result.current.steps[0].hasError).toBe(false)
      expect(result.current.formErrors.name).toHaveLength(0)
    })
  })
})
