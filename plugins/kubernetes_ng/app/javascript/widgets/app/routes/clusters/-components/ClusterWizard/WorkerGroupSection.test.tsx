import React from "react"
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { DEFAULT_WORKER_GROUP } from "./defaults"
import WorkerGroupSection from "./WorkerGroupSection"
import { validWorkerGroupFormData, mockMachineTypes, mockMachineImages, mockRegions } from "../../../../mocks/data"
import userEvent from "@testing-library/user-event"

const defaultProps = {
  availableMachineTypes: mockMachineTypes,
  availableMachineImages: mockMachineImages,
  availableZones: mockRegions[0].zones,
  cloudProfileIsLoading: false,
  cloudProfileError: null,
  formErrors: {},
  validateSingleField: vi.fn(),
  onChange: vi.fn(),
  onDelete: vi.fn(),
}

const TestWrapper =
  (workerGroup = DEFAULT_WORKER_GROUP, totalWorkers = 1, index = 0, overrideProps = {}) =>
  () => (
    <PortalProvider>
      <WorkerGroupSection
        workerGroup={workerGroup}
        index={index}
        totalWorkers={totalWorkers}
        {...defaultProps}
        {...overrideProps}
      />
    </PortalProvider>
  )

describe("WorkerGroupSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("renders worker group title default if no name is provided", () => {
    const workerGroupWithoutName = { ...DEFAULT_WORKER_GROUP, name: "" }
    const wrapper = TestWrapper(workerGroupWithoutName)
    render(wrapper())

    expect(screen.getByText("Worker Group: New Worker Group")).toBeInTheDocument()
  })

  it("renders worker group title with provided name", () => {
    const workerGroupWithName = { ...DEFAULT_WORKER_GROUP, name: "custom-worker" }
    const wrapper = TestWrapper(workerGroupWithName)
    render(wrapper())

    expect(screen.getByText(`Worker Group: ${workerGroupWithName.name}`)).toBeInTheDocument()
  })

  it("renders worker fields", async () => {
    const wrapper = TestWrapper(validWorkerGroupFormData)
    render(wrapper())

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

    const minimumInput = within(section).getByLabelText("Min Nodes")
    expect(minimumInput).toHaveValue(validWorkerGroupFormData.minimum)
    const maximumInput = within(section).getByLabelText("Max Nodes")
    expect(maximumInput).toHaveValue(validWorkerGroupFormData.maximum)

    expect(within(section).getByLabelText("Availability Zones")).toBeInTheDocument()
    validWorkerGroupFormData.zones.forEach((zone) => {
      expect(within(section).getByText(zone)).toBeInTheDocument()
    })
  })

  it("validates on blur", () => {
    const validateSingleField = vi.fn()
    const wrapper = TestWrapper(validWorkerGroupFormData, 1, 0, { validateSingleField })
    render(wrapper())

    const fields = [
      { label: "Name", key: "name" },
      { label: "Machine Type", key: "machineType" },
      { label: "Machine Image", key: "machineImage.name" },
      { label: "Image Version", key: "machineImage.version" },
      { label: "Min Nodes", key: "minimum" },
      { label: "Max Nodes", key: "maximum" },
      { label: "Availability Zones", key: "zones" },
    ]

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    fields.forEach(({ label, key }) => {
      const input = within(section).getByLabelText(label)
      fireEvent.change(input, { target: { value: "test" } })
      fireEvent.blur(input)
      expect(validateSingleField).toHaveBeenCalledWith(`workers.${validWorkerGroupFormData.id}.${key}`)
    })
  })

  it("updates field values when inputs change", async () => {
    const onChange = vi.fn()
    const wrapper = TestWrapper(validWorkerGroupFormData, 1, 0, { onChange })
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    // Test text fields
    const nameInput = within(section).getByLabelText("Name")
    fireEvent.change(nameInput, { target: { value: "new-name" } })
    expect(nameInput).toHaveValue("new-name")

    const minNodesInput = within(section).getByLabelText("Min Nodes")
    fireEvent.change(minNodesInput, { target: { value: 2 } })
    expect(minNodesInput).toHaveValue(2)

    const maxNodesInput = within(section).getByLabelText("Max Nodes")
    fireEvent.change(maxNodesInput, { target: { value: 3 } })
    expect(maxNodesInput).toHaveValue(3)

    // Test Availability Zones select
    const zonesSelect = within(section).getByLabelText("Availability Zones")
    expect(zonesSelect).toHaveTextContent(validWorkerGroupFormData.zones[0])
    await waitFor(() => userEvent.click(zonesSelect))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    const zoneOptions = screen.getAllByRole("option")
    expect(zoneOptions.length).toBeGreaterThan(0)
    await waitFor(() => userEvent.click(zoneOptions[1]))
    expect(onChange).toHaveBeenCalled()
    onChange.mockClear()

    // Test Machine Type select (enabled after zone is selected)
    const machineTypeSelect = within(section).getByLabelText("Machine Type")
    await waitFor(() => userEvent.click(machineTypeSelect))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    const machineTypeOptions = screen.getAllByRole("option")
    expect(machineTypeOptions.length).toBeGreaterThan(0)
    await waitFor(() => userEvent.click(machineTypeOptions[0]))
    expect(onChange).toHaveBeenCalled()
    onChange.mockClear()

    // Test Machine Image select
    const machineImageSelect = within(section).getByLabelText("Machine Image")
    await waitFor(() => userEvent.click(machineImageSelect))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    const imageOptions = screen.getAllByRole("option")
    expect(imageOptions.length).toBeGreaterThan(0)
    await waitFor(() => userEvent.click(imageOptions[1]))
    expect(onChange).toHaveBeenCalled()
    onChange.mockClear()

    // Test Image Version select (enabled after image is selected)
    const imageVersionSelect = within(section).getByLabelText("Image Version")
    await waitFor(() => userEvent.click(imageVersionSelect))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    const versionOptions = screen.getAllByRole("option")
    expect(versionOptions.length).toBeGreaterThan(0)
    await waitFor(() => userEvent.click(versionOptions[0]))
    expect(onChange).toHaveBeenCalled()
  })

  it("resets image version when machine image changes", async () => {
    const onChange = vi.fn()
    const workerWithImageVersion = {
      ...validWorkerGroupFormData,
      machineImage: {
        name: "ubuntu",
        version: "20.04",
      },
    }
    const wrapper = TestWrapper(workerWithImageVersion, 1, 0, { onChange })
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(workerWithImageVersion.name, "i") })
    const machineImageSelect = within(section).getByLabelText("Machine Image")

    // Open the machine image dropdown
    await waitFor(() => userEvent.click(machineImageSelect))
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    const imageOptions = screen.getAllByRole("option")
    expect(imageOptions.length).toBeGreaterThan(1)

    // Select a different image (second option)
    await waitFor(() => userEvent.click(imageOptions[1]))

    // Verify onChange was called with version reset to empty string
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        machineImage: expect.objectContaining({
          name: mockMachineImages[1].name,
          version: "", // version should be reset when image changes
        }),
      })
    )
  })

  it("displays errors for all fields", () => {
    const formErrors = {
      [`workers.${validWorkerGroupFormData.id}.name`]: ["Name is required"],
      [`workers.${validWorkerGroupFormData.id}.machineType`]: ["Machine Type is required"],
      [`workers.${validWorkerGroupFormData.id}.machineImage.name`]: ["Machine Image is required"],
      [`workers.${validWorkerGroupFormData.id}.machineImage.version`]: ["Image Version is required"],
      [`workers.${validWorkerGroupFormData.id}.minimum`]: ["Minimum Nodes are required"],
      [`workers.${validWorkerGroupFormData.id}.maximum`]: ["Maximum Nodes are required"],
      [`workers.${validWorkerGroupFormData.id}.zones`]: ["At least one zone must be selected"],
    }

    const wrapper = TestWrapper(validWorkerGroupFormData, 1, 0, { formErrors })
    render(wrapper())

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
    const wrapper = TestWrapper(validWorkerGroupFormData)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    const deleteButton = await screen.queryByLabelText(`Delete Worker Group ${validWorkerGroupFormData.name}`)
    expect(deleteButton).toBeNull()
  })

  it("displays onDelete button when there are more then one worker group and not the first one", async () => {
    const wrapper = TestWrapper(validWorkerGroupFormData, 2, 1)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(section).toBeInTheDocument()

    const deleteButton = await screen.queryByLabelText(`Delete Worker Group ${validWorkerGroupFormData.name}`)
    expect(deleteButton).toBeInTheDocument()
  })

  it("shows all fields enabled", () => {
    const wrapper = TestWrapper(validWorkerGroupFormData, 1, 0)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(within(section).getByLabelText("Name")).not.toBeDisabled()
    expect(within(section).getByLabelText("Machine Type")).not.toHaveAttribute("disabled")
    expect(within(section).getByLabelText("Machine Image")).not.toHaveAttribute("disabled")
    expect(within(section).getByLabelText("Image Version")).not.toHaveAttribute("disabled")
    expect(within(section).getByLabelText("Min Nodes")).not.toBeDisabled()
    expect(within(section).getByLabelText("Max Nodes")).not.toBeDisabled()
    expect(within(section).getByLabelText("Availability Zones")).not.toHaveAttribute("disabled")
  })

  it("disables machine type field when no availability zone is selected", () => {
    const workerWithoutZone = { ...validWorkerGroupFormData, zones: [] }
    const wrapper = TestWrapper(workerWithoutZone, 1, 0)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(workerWithoutZone.name, "i") })
    expect(within(section).getByLabelText("Machine Type")).toHaveAttribute("disabled")
  })

  it("shows correct help text for machine type when no zone is selected", () => {
    const workerWithoutZone = { ...validWorkerGroupFormData, zones: [] }
    const wrapper = TestWrapper(workerWithoutZone, 1, 0)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(workerWithoutZone.name, "i") })
    expect(within(section).getByText("Select an availability zone first")).toBeInTheDocument()
  })

  it("shows correct help text for machine type when zone is selected", () => {
    const wrapper = TestWrapper(validWorkerGroupFormData, 1, 0)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(validWorkerGroupFormData.name, "i") })
    expect(
      within(section).getByText("Select the machine type for the worker nodes. Available types vary by zone.")
    ).toBeInTheDocument()
  })

  it("filters out unavailable machine types for selected zone", async () => {
    // Create a worker with zone us-east-1a selected
    const workerWithZone = { ...validWorkerGroupFormData, zones: ["us-east-1a"] }
    const wrapper = TestWrapper(workerWithZone, 1, 0)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(workerWithZone.name, "i") })
    const machineTypeSelect = within(section).getByLabelText("Machine Type")

    // Verify the select is enabled (zone is selected)
    expect(machineTypeSelect).not.toHaveAttribute("disabled")

    // Click to open the dropdown
    await waitFor(() => userEvent.click(machineTypeSelect))

    // Get all options (they're in a portal, so use screen not within)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    const options = screen.getAllByRole("option")

    // us-east-1a has "unavailable-type" in its unavailableMachineTypes
    // So we should only see 3 options: m5.large, m5.xlarge, c5.large
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent("m5.large")
    expect(options[1]).toHaveTextContent("m5.xlarge")
    expect(options[2]).toHaveTextContent("c5.large")

    // Verify "unavailable-type" is NOT in the list
    const optionTexts = options.map((opt) => opt.textContent)
    expect(optionTexts).not.toContain("unavailable-type")

    // Verify help text shows zone-aware message
    expect(
      within(section).getByText("Select the machine type for the worker nodes. Available types vary by zone.")
    ).toBeInTheDocument()
  })

  it("shows all machine types when zone has no unavailable types", async () => {
    // Create a worker with zone us-east-1b selected (no unavailable types)
    const workerWithZone = { ...validWorkerGroupFormData, zones: ["us-east-1b"] }
    const wrapper = TestWrapper(workerWithZone, 1, 0)
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(workerWithZone.name, "i") })
    const machineTypeSelect = within(section).getByLabelText("Machine Type")

    // Verify the select is enabled
    expect(machineTypeSelect).not.toHaveAttribute("disabled")

    // Click to open the dropdown
    await waitFor(() => userEvent.click(machineTypeSelect))

    // Get all options (they're in a portal, so use screen not within)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    const options = screen.getAllByRole("option")

    // us-east-1b has NO unavailableMachineTypes
    // So we should see all 4 machine types: m5.large, m5.xlarge, c5.large, unavailable-type
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveTextContent("m5.large")
    expect(options[1]).toHaveTextContent("m5.xlarge")
    expect(options[2]).toHaveTextContent("c5.large")
    expect(options[3]).toHaveTextContent("unavailable-type")
  })

  it("does not show error for machine type when it is disabled", () => {
    const workerWithoutZone = { ...validWorkerGroupFormData, zones: [] }
    const formErrors = {
      [`workers.${validWorkerGroupFormData.id}.machineType`]: ["Machine Type is required"],
    }
    const wrapper = TestWrapper(workerWithoutZone, 1, 0, { formErrors })
    render(wrapper())

    const section = screen.getByRole("region", { name: new RegExp(workerWithoutZone.name, "i") })
    expect(within(section).queryByText("Machine Type is required")).not.toBeInTheDocument()
  })
})
