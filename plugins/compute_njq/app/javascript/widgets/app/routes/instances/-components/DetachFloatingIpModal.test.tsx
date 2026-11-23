import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { DetachFloatingIpModal } from "./DetachFloatingIpModal"

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

function renderModal(ips: Instance["ips"], detachFloatingIp = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <DetachFloatingIpModal
        instance={makeInstance(ips)}
        apiClient={{ instances: { detachFloatingIp } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { detachFloatingIp, onClose }
}

describe("DetachFloatingIpModal", () => {
  it("lists the instance's floating IPs as choices", () => {
    renderModal([
      { addr: "1.1.1.1", type: "floating" },
      { addr: "2.2.2.2", type: "floating" },
      { addr: "10.0.0.5", type: "fixed" },
    ])
    // Open the dropdown and read its options.
    fireEvent.click(screen.getByRole("button", { name: /choose a floating ip/i }))
    const options = screen.getAllByRole("option").map((o) => o.textContent)
    expect(options).toEqual(expect.arrayContaining(["1.1.1.1", "2.2.2.2"]))
    // The fixed IP is not offered for detachment.
    expect(options).not.toContain("10.0.0.5")
  })

  it("preselects the only floating IP and detaches it on submit", async () => {
    const { detachFloatingIp, onClose } = renderModal([{ addr: "1.1.1.1", type: "floating" }])
    fireEvent.click(screen.getByRole("button", { name: /detach/i }))
    await waitFor(() => expect(detachFloatingIp).toHaveBeenCalledWith("s1", { floating_ip_address: "1.1.1.1" }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("requires a selection when the instance has several floating IPs", async () => {
    const { detachFloatingIp } = renderModal([
      { addr: "1.1.1.1", type: "floating" },
      { addr: "2.2.2.2", type: "floating" },
    ])
    expect(screen.getByRole("button", { name: /detach/i })).toBeDisabled()
    // Pick the second IP from the dropdown.
    fireEvent.click(screen.getByRole("button", { name: /choose a floating ip/i }))
    fireEvent.click(screen.getByRole("option", { name: "2.2.2.2" }))
    const submit = screen.getByRole("button", { name: /detach/i })
    expect(submit).not.toBeDisabled()
    fireEvent.click(submit)
    await waitFor(() => expect(detachFloatingIp).toHaveBeenCalledWith("s1", { floating_ip_address: "2.2.2.2" }))
  })

  it("keeps the modal open and shows the error on a failed submit", async () => {
    const detachFloatingIp = vi.fn().mockRejectedValue(new Error("Neutron is down"))
    const { onClose } = renderModal([{ addr: "1.1.1.1", type: "floating" }], detachFloatingIp)
    fireEvent.click(screen.getByRole("button", { name: /detach/i }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Neutron is down"))
    expect(onClose).not.toHaveBeenCalled()
  })
})
