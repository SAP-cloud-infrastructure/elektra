import React from "react"
import { renderHook, screen, within, fireEvent } from "@testing-library/react"
import { WizardProvider, useWizard } from "./WizzardProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { defaultMockClient } from "../../../../mocks/TestTools"
import { DEFAULT_WORKER_GROUP, DEFAULT_CLUSTER_FORM_DATA } from "./defaults"
import WorkerGroupSection from "./WorkerGroupSection"
import { validWorkerGroupFormData } from "../../../../mocks/data"
import * as wizardHook from "./WizzardProvider"
import userEvent from "@testing-library/user-event"

const TestWrapper =
  (queryClient: QueryClient, workerGroup = DEFAULT_WORKER_GROUP, totalWorkers = 1, index = 0) =>
  ({ children }: { children: React.ReactNode }) => (
    <PortalProvider>
      <QueryClientProvider client={queryClient}>
        <WizardProvider client={defaultMockClient} region="us-east-1" formData={DEFAULT_CLUSTER_FORM_DATA}>
          <WorkerGroupSection
            workerGroup={workerGroup}
            index={index}
            totalWorkers={totalWorkers}
            onChange={() => {}}
            onDelete={() => {}}
          />
          {children}
        </WizardProvider>
      </QueryClientProvider>
    </PortalProvider>
  )

describe("WorkerGroupSection", () => {
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

  it("renders worker group title default if no name is provided", () => {
    const workerGroupWithoutName = { ...DEFAULT_WORKER_GROUP, name: "" }
    const wrapper = TestWrapper(queryClient, workerGroupWithoutName)
    renderHook(() => useWizard(), { wrapper })

    expect(screen.getByText("Worker Group: New Worker Group")).toBeInTheDocument()
  })

  it("renders worker group title with provided name", () => {
    const workerGroupWithName = { ...DEFAULT_WORKER_GROUP, name: "custom-worker" }
    const wrapper = TestWrapper(queryClient, workerGroupWithName)
    renderHook(() => useWizard(), { wrapper })

    expect(screen.getByText(`Worker Group: ${workerGroupWithName.name}`)).toBeInTheDocument()
  })

  it("renders worker fields", async () => {
    const wrapper = TestWrapper(queryClient, validWorkerGroupFormData)
    renderHook(() => useWizard(), { wrapper })

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    const { getByText } = within(section)
    const title = getByText(`Worker Group: ${validWorkerGroupFormData.name}`)
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe("H1")

    const nameInput = within(section).getByLabelText("Name")
    expect(nameInput).toHaveValue(validWorkerGroupFormData.name)

    // selects shouldn't be checked within the component since they use a portal
    expect(within(section).getByLabelText("Machine Type")).toBeInTheDocument()
    expect(await within(section).findByText(validWorkerGroupFormData.machineType)).toBeInTheDocument()
    expect(within(section).getByLabelText("Machine Image")).toBeInTheDocument()
    expect(await within(section).findByText(validWorkerGroupFormData.machineImage.name)).toBeInTheDocument()
    expect(within(section).getByLabelText("Image Version")).toBeInTheDocument()
    expect(await within(section).findByText(validWorkerGroupFormData.machineImage.version)).toBeInTheDocument()

    const minimumInput = within(section).getByLabelText("Minimum Nodes")
    expect(minimumInput).toHaveValue(validWorkerGroupFormData.minimum)
    const maximumInput = within(section).getByLabelText("Maximum Nodes")
    expect(maximumInput).toHaveValue(validWorkerGroupFormData.maximum)

    expect(within(section).getByLabelText("Availability Zones")).toBeInTheDocument()
    validWorkerGroupFormData.zones.forEach((zone) => {
      expect(within(section).getByText(zone)).toBeInTheDocument()
    })
  })

  it("validates on blur", () => {
    const wrapper = TestWrapper(queryClient, validWorkerGroupFormData)
    const originalUseWizard = wizardHook.useWizard
    const validateSingleField = vi.fn()

    const fields = [
      { label: "Name", key: "name" },
      { label: "Machine Type", key: "machineType" },
      { label: "Machine Image", key: "machineImage.name" },
      { label: "Image Version", key: "machineImage.version" },
      { label: "Minimum Nodes", key: "minimum" },
      { label: "Maximum Nodes", key: "maximum" },
      { label: "Availability Zones", key: "zones" },
    ]

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        validateSingleField: validateSingleField,
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    fields.forEach(({ label, key }) => {
      const input = within(section).getByLabelText(label)
      fireEvent.change(input, { target: { value: "test" } })
      fireEvent.blur(input)
      expect(validateSingleField).toHaveBeenCalledWith(`workers.${validWorkerGroupFormData.id}.${key}`)
    })
  })

  it("calls onChange updates data", () => {
    const wrapper = TestWrapper(queryClient, validWorkerGroupFormData)

    const textFields = [
      { label: "Name", key: "name", value: "new-name" },
      { label: "Minimum Nodes", key: "minimum", value: 2 },
      { label: "Maximum Nodes", key: "maximum", value: 3 },
    ]

    const selects = [
      { label: "Machine Type", key: "machineType" },
      { label: "Machine Image", key: "machineImage.name" },
      { label: "Image Version", key: "machineImage.version" },
      { label: "Availability Zones", key: "zones" },
    ]

    renderHook(() => useWizard(), { wrapper })

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    textFields.forEach(({ label, value }) => {
      const input = within(section).getByLabelText(label)
      fireEvent.change(input, { target: { value: value } })
      expect(input).toHaveValue(value)
    })

    selects.forEach(async ({ label }) => {
      const select = within(section).getByLabelText(label)
      const firstOption = await within(section).findAllByRole("option")
      await userEvent.click(select)
      await userEvent.click(firstOption[1])
      expect(select).toHaveValue(firstOption[0].getAttribute("value"))
      if (label === "Machine Type") {
        // selecting machine type should reset image version
        const imageVersionSelect = within(section).getByLabelText("Image Version")
        expect(imageVersionSelect).toHaveValue("")
      }
    })
  })

  it("displays errors for all fields", () => {
    const wrapper = TestWrapper(queryClient, validWorkerGroupFormData)
    const originalUseWizard = wizardHook.useWizard

    vi.spyOn(wizardHook, "useWizard").mockImplementation(() => {
      const original = originalUseWizard()
      return {
        ...original,
        formErrors: {
          [`workers.${validWorkerGroupFormData.id}.name`]: ["Name is required"],
          [`workers.${validWorkerGroupFormData.id}.machineType`]: ["Machine Type is required"],
          [`workers.${validWorkerGroupFormData.id}.machineImage.name`]: ["Machine Image is required"],
          [`workers.${validWorkerGroupFormData.id}.machineImage.version`]: ["Image Version is required"],
          [`workers.${validWorkerGroupFormData.id}.minimum`]: ["Minimum Nodes are required"],
          [`workers.${validWorkerGroupFormData.id}.maximum`]: ["Maximum Nodes are required"],
          [`workers.${validWorkerGroupFormData.id}.zones`]: ["At least one zone must be selected"],
        },
      }
    })

    renderHook(() => useWizard(), { wrapper })

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    expect(within(section).getByText("Name is required")).toBeInTheDocument()
    expect(within(section).getByText("Machine Type is required")).toBeInTheDocument()
    expect(within(section).getByText("Machine Image is required")).toBeInTheDocument()
    expect(within(section).getByText("Image Version is required")).toBeInTheDocument()
    expect(within(section).getByText("Minimum Nodes are required")).toBeInTheDocument()
    expect(within(section).getByText("Maximum Nodes are required")).toBeInTheDocument()
    expect(within(section).getByText("At least one zone must be selected")).toBeInTheDocument()
  })

  it("doesn't displays onDelete button when just one worker group is present or is the first one", async () => {
    const wrapper = TestWrapper(queryClient, validWorkerGroupFormData)
    renderHook(() => useWizard(), { wrapper })

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    const deleteButton = await screen.queryByLabelText(`Delete Worker Group ${validWorkerGroupFormData.name}`)
    expect(deleteButton).toBeNull()
  })

  it("displays onDelete button when there are more then one worker group and not the first one", async () => {
    const wrapper = TestWrapper(queryClient, validWorkerGroupFormData, 2, 1)
    renderHook(() => useWizard(), { wrapper })

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    const deleteButton = await screen.queryByLabelText(`Delete Worker Group ${validWorkerGroupFormData.name}`)
    expect(deleteButton).toBeInTheDocument()
  })
})
