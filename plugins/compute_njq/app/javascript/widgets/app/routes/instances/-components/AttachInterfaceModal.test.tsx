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

describe("AttachInterfaceModal", () => {
  beforeEach(() => mutate.mockClear())

  it("disables Attach until a network is chosen", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /^attach$/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/network/i), { target: { value: "n1" } })
    expect(screen.getByRole("button", { name: /^attach$/i })).toBeEnabled()
  })

  it("only lists subnets of the chosen network", () => {
    renderModal()
    fireEvent.change(screen.getByLabelText(/network/i), { target: { value: "n1" } })
    const subnetSelect = screen.getByLabelText(/subnet/i)
    const values = Array.from(subnetSelect.querySelectorAll("option")).map((o) => (o as HTMLOptionElement).value)
    expect(values).toContain("sub1")
    expect(values).not.toContain("sub2")
  })

  it("keeps the fixed-ip input disabled until a subnet is chosen", () => {
    renderModal()
    fireEvent.change(screen.getByLabelText(/network/i), { target: { value: "n1" } })
    expect(screen.getByLabelText(/fixed ip/i)).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/subnet/i), { target: { value: "sub1" } })
    expect(screen.getByLabelText(/fixed ip/i)).toBeEnabled()
  })

  it("submits the selected network, subnet, ip and security groups", async () => {
    renderModal()
    fireEvent.change(screen.getByLabelText(/network/i), { target: { value: "n1" } })
    fireEvent.change(screen.getByLabelText(/subnet/i), { target: { value: "sub1" } })
    fireEvent.change(screen.getByLabelText(/fixed ip/i), { target: { value: "10.0.0.9" } })
    fireEvent.click(screen.getByLabelText("default"))
    fireEvent.click(screen.getByRole("button", { name: /^attach$/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const [vars] = mutate.mock.calls[0]
    expect(vars).toMatchObject({
      id: "s1",
      network_id: "n1",
      subnet_id: "sub1",
      ip_address: "10.0.0.9",
      security_groups: ["sg1"],
    })
  })
})
