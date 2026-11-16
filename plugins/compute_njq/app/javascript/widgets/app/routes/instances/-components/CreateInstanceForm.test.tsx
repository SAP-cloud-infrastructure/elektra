import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { CreateInstanceForm } from "./CreateInstanceForm"

let flavorData = [
  { id: "f1", name: "m1.small", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
]
vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: flavorData, isLoading: false }),
  useImagesQuery: () => ({
    data: {
      images: [
        {
          id: "i1",
          name: "ubuntu",
          visibility: "public",
          hypervisor_type: "kvm",
          img_hv_type: null,
          image_type: null,
          disk_format: "qcow2",
          buildnumber: null,
          min_disk: 0,
          size: 1024,
        },
      ],
    },
    isLoading: false,
  }),
  useKeypairsQuery: () => ({ data: [{ name: "k1" }], isLoading: false }),
  useNetworksQuery: () => ({ data: [{ id: "n1", name: "private" }], isLoading: false }),
  useSecurityGroupsQuery: () => ({
    data: [{ id: "sg1", name: "default", project_id: "p1", project_label: "monsoon3/demo" }],
    isLoading: false,
  }),
  useAvailabilityZonesQuery: () => ({ data: [{ name: "az-1" }], isLoading: false }),
}))

const mutate = vi.fn()
let mutationState = { mutate, isPending: false, isError: false, error: null as Error | null }
vi.mock("../../../hooks/useCreateInstanceMutation", () => ({
  useCreateInstanceMutation: () => mutationState,
}))

const api = {} as never
const queryClient = new QueryClient()

describe("CreateInstanceForm", () => {
  it("keeps submit disabled until required fields are valid", () => {
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled()
  })

  it("shows an error alert when the mutation fails", () => {
    mutationState = { mutate, isPending: false, isError: true, error: new Error("Quota exceeded (HTTP 403)") }
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.getByText(/Quota exceeded/)).toBeInTheDocument()
  })

  it("renders a Cancel button that invokes onCancel", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    const onCancel = vi.fn()
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("omits the Cancel button when onCancel is not provided", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
  })

  it("in modal mode (formId set) renders no in-form buttons and tags the form id", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    const { container } = render(
      <CreateInstanceForm
        api={api}
        queryClient={queryClient}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        formId="create-instance-form"
      />
    )
    // The footer (outside the form) owns the buttons now.
    expect(screen.queryByRole("button", { name: /create/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    // The form carries the id so a footer button can target it via `form=`.
    expect(container.querySelector("form#create-instance-form")).toBeInTheDocument()
  })

  it("reports its submit-ability to onStatusChange", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    flavorData = [
      { id: "f1", name: "m1.small", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
    ]
    const onStatusChange = vi.fn()
    render(
      <CreateInstanceForm
        api={api}
        queryClient={queryClient}
        onSuccess={vi.fn()}
        formId="create-instance-form"
        onStatusChange={onStatusChange}
      />
    )
    // Nothing filled in yet → not submittable.
    expect(onStatusChange).toHaveBeenLastCalledWith({ canSubmit: false, isPending: false })
  })

  it("forces a prefilled root disk size for a disk-less kvm flavor", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    flavorData = [{ id: "f0", name: "no-disk", vcpus: 1, ram: 2048, disk: 0, hypervisor_type: "kvm", is_public: true }]
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)

    // Type first, then pick the disk-less flavor from the (now visible) dropdown.
    fireEvent.click(screen.getByRole("tab", { name: "KVM" }))
    fireEvent.click(screen.getByText("Select a flavor…"))
    fireEvent.click(screen.getByText(/no-disk/))

    // The size field is forced visible with the 64 GB prefill, and there is no checkbox.
    expect(screen.getByText(/Custom Root Disk Size/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue("64")).toBeInTheDocument()
    expect(screen.queryByLabelText("Custom root disk")).not.toBeInTheDocument()
  })

  it("does not show a custom root disk control for a flavor with a disk", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    flavorData = [
      { id: "f1", name: "m1.small", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
    ]
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)

    fireEvent.click(screen.getByRole("tab", { name: "KVM" }))
    fireEvent.click(screen.getByText("Select a flavor…"))
    fireEvent.click(screen.getByText(/m1.small/))

    // Optional mode: a checkbox appears, but no size field until it is checked.
    expect(screen.getByLabelText("Custom root disk")).toBeInTheDocument()
    expect(screen.queryByText(/Custom Root Disk Size/i)).not.toBeInTheDocument()
  })

  it("filters flavors by the selected type and clears a prior flavor on type switch", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    flavorData = [
      { id: "k1", name: "kvm-flavor", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
      { id: "v1", name: "vmware-flavor", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "vmware", is_public: true },
    ]
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)

    // KVM tab → only the kvm flavor is offered.
    fireEvent.click(screen.getByRole("tab", { name: "KVM" }))
    fireEvent.click(screen.getByText("Select a flavor…"))
    expect(screen.getByText(/kvm-flavor/)).toBeInTheDocument()
    expect(screen.queryByText(/vmware-flavor/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(/kvm-flavor/))

    // Switch to VMware → the kvm pick is cleared, and only the vmware flavor shows.
    fireEvent.click(screen.getByRole("tab", { name: "VMware" }))
    fireEvent.click(screen.getByText("Select a flavor…"))
    expect(screen.getByText(/vmware-flavor/)).toBeInTheDocument()
    expect(screen.queryByText(/kvm-flavor/)).not.toBeInTheDocument()
  })

  it("explains the image/hypervisor coupling once a flavor is picked", () => {
    mutationState = { mutate, isPending: false, isError: false, error: null }
    flavorData = [
      { id: "k1", name: "kvm-flavor", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
    ]
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)

    // No hint before a flavor is chosen.
    expect(screen.queryByText(/run on any hypervisor/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "KVM" }))
    fireEvent.click(screen.getByText("Select a flavor…"))
    fireEvent.click(screen.getByText(/kvm-flavor/))

    // The hint names the type and explains the overlap with restriction-less images.
    expect(screen.getByText(/Images for KVM and images without a hypervisor restriction/i)).toBeInTheDocument()
  })
})
