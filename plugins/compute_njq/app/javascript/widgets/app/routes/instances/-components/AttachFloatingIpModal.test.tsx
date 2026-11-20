import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { AttachFloatingIpModal } from "./AttachFloatingIpModal"

const optionsData = {
  available_floating_ips: [
    { id: "f1", floating_ip_address: "1.1.1.1" },
    { id: "f2", floating_ip_address: "2.2.2.2" },
  ],
  external_networks: [{ id: "n1", name: "ext-net" }],
}
vi.mock("../../../hooks/useFloatingIpOptionsQuery", () => ({
  useFloatingIpOptionsQuery: () => ({ data: optionsData, isLoading: false }),
}))

function makeInstance(ips: Instance["ips"]): Instance {
  return {
    id: "s1",
    name: "web-01",
    locked: false,
    status: { state: "active", transition: null, power_state: "Running" },
    flavor: { id: null, name: null },
    image: { id: null, name: null },
    ips,
    created: null,
  } as Instance
}

function renderModal(ips: Instance["ips"], attachFloatingIp = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <AttachFloatingIpModal
        instance={makeInstance(ips)}
        apiClient={{ instances: { attachFloatingIp } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { attachFloatingIp, onClose }
}

const singleFixed: Instance["ips"] = [{ addr: "10.0.0.5", type: "fixed" }]

describe("AttachFloatingIpModal", () => {
  it("offers existing free floating IPs and an allocate-new option", () => {
    renderModal(singleFixed)
    const select = screen.getByLabelText(/floating ip/i) as HTMLSelectElement
    const optionText = Array.from(select.options).map((o) => o.textContent)
    expect(optionText).toEqual(expect.arrayContaining(["1.1.1.1", "2.2.2.2"]))
    // The allocate-new mode is offered.
    expect(screen.getByLabelText(/allocate a new/i)).toBeInTheDocument()
  })

  it("attaches an existing FIP to the sole fixed IP", async () => {
    const { attachFloatingIp, onClose } = renderModal(singleFixed)
    fireEvent.change(screen.getByLabelText(/floating ip/i), { target: { value: "f1" } })
    fireEvent.click(screen.getByRole("button", { name: /attach/i }))
    await waitFor(() =>
      expect(attachFloatingIp).toHaveBeenCalledWith("s1", {
        floating_ip_id: "f1",
        floating_network_id: undefined,
        fixed_ip_address: "10.0.0.5",
      })
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("lets the user pick the target fixed IP on a multi-NIC instance", async () => {
    const { attachFloatingIp } = renderModal([
      { addr: "10.0.0.5", type: "fixed" },
      { addr: "10.0.0.9", type: "fixed" },
    ])
    fireEvent.change(screen.getByLabelText(/floating ip/i), { target: { value: "f1" } })
    fireEvent.change(screen.getByLabelText(/fixed ip/i), { target: { value: "10.0.0.9" } })
    fireEvent.click(screen.getByRole("button", { name: /attach/i }))
    await waitFor(() =>
      expect(attachFloatingIp).toHaveBeenCalledWith("s1", {
        floating_ip_id: "f1",
        floating_network_id: undefined,
        fixed_ip_address: "10.0.0.9",
      })
    )
  })

  it("allocates a new FIP when the allocate-new option is chosen", async () => {
    const { attachFloatingIp } = renderModal(singleFixed)
    fireEvent.click(screen.getByLabelText(/allocate a new/i))
    fireEvent.change(screen.getByLabelText(/external network/i), { target: { value: "n1" } })
    fireEvent.click(screen.getByRole("button", { name: /attach/i }))
    await waitFor(() =>
      expect(attachFloatingIp).toHaveBeenCalledWith("s1", {
        floating_ip_id: undefined,
        floating_network_id: "n1",
        fixed_ip_address: "10.0.0.5",
      })
    )
  })

  it("keeps the modal open and shows the error on a failed submit", async () => {
    const attachFloatingIp = vi.fn().mockRejectedValue(new Error("No free IPs"))
    const { onClose } = renderModal(singleFixed, attachFloatingIp)
    fireEvent.change(screen.getByLabelText(/floating ip/i), { target: { value: "f1" } })
    fireEvent.click(screen.getByRole("button", { name: /attach/i }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No free IPs"))
    expect(onClose).not.toHaveBeenCalled()
  })
})
