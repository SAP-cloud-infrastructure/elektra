import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const mutate = vi.fn()
vi.mock("../../../hooks/useAttachInterfaceMutation", () => ({
  useAttachInterfaceMutation: () => ({ mutate, isPending: false, error: null }),
}))
vi.mock("../../../hooks/useInterfaceOptionsQuery", () => ({
  useInterfaceOptionsQuery: () => ({
    data: {
      networks: [{ id: "n1", name: "net-a" }],
      subnets: [
        { id: "sub1", name: "sub-a", cidr: "10.0.0.0/24", network_id: "n1" },
        { id: "sub3", name: "sub-b", cidr: "10.1.0.0/24", network_id: "n1" },
        { id: "sub2", name: "other", cidr: "10.9.0.0/24", network_id: "n9" },
      ],
      security_groups: [{ id: "sg1", name: "default", project_id: "p", project_label: "d/p" }],
    },
    isLoading: false,
  }),
}))

import { AttachInterfaceModal } from "./AttachInterfaceModal"

function renderModal() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <AttachInterfaceModal instance={{ id: "s1" } as never} apiClient={{} as never} onClose={vi.fn()} />
    </QueryClientProvider>
  )
}

// The pickers are button-triggered dropdowns (SearchableSelect / MultiSelect),
// not native <select>s: open the trigger, then click the option by its label.
function pick(triggerText: RegExp, optionText: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name: triggerText }))
  fireEvent.click(screen.getByRole("option", { name: optionText }))
}

describe("AttachInterfaceModal", () => {
  beforeEach(() => mutate.mockClear())

  it("disables Attach until a network is chosen", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /^attach$/i })).toBeDisabled()
    pick(/select a network/i, "net-a")
    expect(screen.getByRole("button", { name: /^attach$/i })).toBeEnabled()
  })

  it("only lists subnets of the chosen network", () => {
    renderModal()
    pick(/select a network/i, "net-a")
    // Open the subnet picker and read its option labels.
    fireEvent.click(screen.getByRole("button", { name: /choose a subnet/i }))
    const options = screen.getAllByRole("option").map((o) => o.textContent)
    expect(options.some((t) => t?.includes("sub-a"))).toBe(true)
    expect(options.some((t) => t?.includes("other"))).toBe(false)
  })

  it("keeps the fixed-ip input disabled until a subnet is chosen", () => {
    renderModal()
    pick(/select a network/i, "net-a")
    expect(screen.getByLabelText(/fixed ip/i)).toBeDisabled()
    pick(/choose a subnet/i, /sub-a/)
    expect(screen.getByLabelText(/fixed ip/i)).toBeEnabled()
  })

  it("renders security groups as a searchable, project-grouped multi-select", () => {
    renderModal()
    // The SG field is the shared MultiSelect: a trigger button, not a flat
    // checkbox list. Opening it reveals a search box and a project group header.
    fireEvent.click(screen.getByLabelText(/security groups/i))
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    // Project grouping: the SG appears under its "<domain>/<project>" header.
    expect(screen.getByText("d/p")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "default" })).toBeInTheDocument()
  })

  it("submits the selected network, subnet, ip and security groups", async () => {
    renderModal()
    pick(/select a network/i, "net-a")
    pick(/choose a subnet/i, /sub-a/)
    fireEvent.change(screen.getByLabelText(/fixed ip/i), { target: { value: "10.0.0.9" } })
    fireEvent.click(screen.getByLabelText(/security groups/i))
    fireEvent.click(screen.getByRole("option", { name: "default" }))
    fireEvent.click(screen.getByRole("button", { name: /^attach$/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const [vars] = mutate.mock.calls[0]
    expect(vars).toMatchObject({
      id: "s1",
      network_id: "n1",
      subnet_id: "sub1",
      ip_address: "10.0.0.9",
      // Neutron ports reference security groups by UUID: submit the id, not the name.
      security_groups: ["sg1"],
    })
  })

  it("clears a stale fixed ip when switching from one subnet to another", async () => {
    renderModal()
    pick(/select a network/i, "net-a")
    pick(/choose a subnet/i, /sub-a/)
    fireEvent.change(screen.getByLabelText(/fixed ip/i), { target: { value: "10.0.0.9" } })
    // Switch to another subnet in the same network: the IP from sub1's CIDR must not carry over.
    pick(/sub-a/, /sub-b/)
    expect(screen.getByLabelText(/fixed ip/i)).toHaveValue("")
    fireEvent.click(screen.getByRole("button", { name: /^attach$/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const [vars] = mutate.mock.calls[0]
    expect(vars).toMatchObject({ id: "s1", network_id: "n1", subnet_id: "sub3", ip_address: undefined })
  })
})
