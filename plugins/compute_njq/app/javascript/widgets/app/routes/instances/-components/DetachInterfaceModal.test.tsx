import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const mutate = vi.fn()
vi.mock("../../../hooks/useDetachInterfaceMutation", () => ({
  useDetachInterfaceMutation: () => ({ mutate, isPending: false, error: null }),
}))
const queryState = vi.hoisted(() => ({
  data: { attached_interfaces: [{ port_id: "p1", fixed_ip_address: "10.0.0.9", mac_addr: "aa:bb" }] },
  isLoading: false,
}))
vi.mock("../../../hooks/useAttachedInterfacesQuery", () => ({
  useAttachedInterfacesQuery: () => queryState,
}))

import { DetachInterfaceModal } from "./DetachInterfaceModal"

function renderModal() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <DetachInterfaceModal instance={{ id: "s1" } as never} apiClient={{} as never} onClose={vi.fn()} />
    </QueryClientProvider>
  )
}

describe("DetachInterfaceModal", () => {
  beforeEach(() => {
    mutate.mockClear()
    queryState.isLoading = false
    queryState.data = { attached_interfaces: [{ port_id: "p1", fixed_ip_address: "10.0.0.9", mac_addr: "aa:bb" }] }
  })

  it("lists interfaces from the live query and auto-selects the only one", () => {
    renderModal()
    expect(screen.getByText(/10\.0\.0\.9/)).toBeInTheDocument()
  })

  it("shows the dropdown with a loading spinner while interfaces load", () => {
    queryState.isLoading = true
    queryState.data = { attached_interfaces: [] }
    renderModal()
    // The field is rendered (not a bare "Loading…" line) and shows the shared
    // disabled+spinner loading pattern on its trigger.
    const trigger = screen.getByRole("button", { name: /loading/i })
    expect(trigger).toBeDisabled()
    expect(trigger.querySelector(".spinner")).toBeInTheDocument()
  })

  it("submits the selected fixed ip", async () => {
    renderModal()
    fireEvent.click(screen.getByRole("button", { name: /^detach$/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const [vars] = mutate.mock.calls[0]
    expect(vars).toMatchObject({ id: "s1", fixed_ip_address: "10.0.0.9" })
  })
})
