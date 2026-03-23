import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import WorkerGroupEditor from "./WorkerGroupEditor"
import { DEFAULT_WORKER_GROUP } from "./defaults"
import { mockMachineTypes, mockMachineImages, mockRegions } from "../../../../mocks/data"

const defaultProps = {
  availableMachineTypes: mockMachineTypes,
  availableMachineImages: mockMachineImages,
  availableZones: mockRegions[0].zones,
  cloudProfileIsLoading: false,
  cloudProfileError: null,
  formErrors: {},
  validateSingleField: vi.fn(),
  onChange: vi.fn(),
}

const TestWrapper = (workers = [{ ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" }], overrideProps = {}) => (
  <PortalProvider>
    <WorkerGroupEditor workers={workers} {...defaultProps} {...overrideProps} />
  </PortalProvider>
)

describe("WorkerGroupEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("renders info message and description", () => {
    render(TestWrapper())

    expect(screen.getByText("Node Auto-scaling")).toBeInTheDocument()
    expect(
      screen.getByText(/Configure the worker nodes for your cluster/i)
    ).toBeInTheDocument()
  })

  it("renders initial worker group", () => {
    const worker = { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker-test1" }
    render(TestWrapper([worker]))

    expect(screen.getByText((content) => content.includes(worker.name))).toBeInTheDocument()
  })

  it("renders multiple worker groups", () => {
    const workers = [
      { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" },
      { ...DEFAULT_WORKER_GROUP, id: "worker-2", name: "worker2" },
    ]
    render(TestWrapper(workers))

    expect(screen.getByText((content) => content.includes("worker1"))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes("worker2"))).toBeInTheDocument()
  })

  it("calls onChange when adding a new worker group", async () => {
    const onChange = vi.fn()
    const workers = [{ ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" }]
    render(TestWrapper(workers, { onChange }))

    const addButton = screen.getByRole("button", { name: /Add Worker Group/i })
    await userEvent.click(addButton)

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "worker-1", name: "worker1" }),
        expect.objectContaining({ name: "worker2" }),
      ])
    )
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("doesn't show delete button for the first worker group", () => {
    const workers = [
      { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" },
      { ...DEFAULT_WORKER_GROUP, id: "worker-2", name: "worker2" },
    ]
    render(TestWrapper(workers))

    const deleteButton = screen.queryByLabelText("Delete Worker Group worker1")
    expect(deleteButton).toBeNull()
  })

  it("shows delete button for additional worker groups", () => {
    const workers = [
      { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" },
      { ...DEFAULT_WORKER_GROUP, id: "worker-2", name: "worker2" },
    ]
    render(TestWrapper(workers))

    const deleteButton = screen.getByLabelText("Delete Worker Group worker2")
    expect(deleteButton).toBeInTheDocument()
  })

  it("calls onChange when deleting a worker group", async () => {
    const onChange = vi.fn()
    const workers = [
      { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" },
      { ...DEFAULT_WORKER_GROUP, id: "worker-2", name: "worker2" },
    ]
    render(TestWrapper(workers, { onChange }))

    const deleteButton = screen.getByLabelText("Delete Worker Group worker2")
    await userEvent.click(deleteButton)

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "worker-1", name: "worker1" }),
    ])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("calls onChange when updating a worker group field", async () => {
    const onChange = vi.fn()
    const workers = [{ ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" }]
    render(TestWrapper(workers, { onChange }))

    const section = screen.getByRole("region", { name: /worker1/i })
    const nameInput = within(section).getByLabelText("Name")

    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "updated-name")

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "worker-1", name: expect.stringContaining("updated") }),
    ])
  })

  it("renders separator between worker groups", () => {
    const workers = [
      { ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" },
      { ...DEFAULT_WORKER_GROUP, id: "worker-2", name: "worker2" },
    ]
    const { container } = render(TestWrapper(workers))

    const separators = container.querySelectorAll("hr")
    expect(separators).toHaveLength(1)
  })

  it("doesn't render separator for single worker group", () => {
    const workers = [{ ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" }]
    const { container } = render(TestWrapper(workers))

    const separators = container.querySelectorAll("hr")
    expect(separators).toHaveLength(0)
  })

  it("passes cloud profile props to worker sections", () => {
    const workers = [{ ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" }]
    render(
      TestWrapper(workers, {
        cloudProfileIsLoading: true,
      })
    )

    const section = screen.getByRole("region", { name: /worker1/i })
    expect(within(section).getByLabelText("Machine Type")).toBeInTheDocument()
  })

  it("passes form errors to worker sections", () => {
    const workers = [{ ...DEFAULT_WORKER_GROUP, id: "worker-1", name: "worker1" }]
    const formErrors = {
      "workers.worker-1.name": ["Name is required"],
    }
    render(TestWrapper(workers, { formErrors }))

    expect(screen.getByText("Name is required")).toBeInTheDocument()
  })
})
