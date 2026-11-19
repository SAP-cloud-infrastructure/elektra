import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { ResizeModal } from "./ResizeModal"

const flavorData = [
  { id: "f1", name: "m1.small", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
  { id: "f2", name: "m1.large", vcpus: 4, ram: 8192, disk: 80, hypervisor_type: "kvm", is_public: true },
  { id: "f3", name: "v1.large", vcpus: 4, ram: 8192, disk: 80, hypervisor_type: "vmware", is_public: true },
]
vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: flavorData, isLoading: false }),
}))

// The current hypervisor type is read from the instance detail (server flavor
// extra_specs), not the flavor catalog — the catalog may omit extra_specs by
// policy. Mock the detail query so we control the type the modal displays and
// whether it is still resolving. While the detail is still loading the query
// serves placeholder data (from the list row) whose specs carry no hypervisor
// type yet: isLoading is false but isPlaceholderData is true.
let detailHypervisor: string | null = "kvm"
let detailLoading = false
vi.mock("../../../hooks/useInstanceQueries", () => ({
  useInstanceDetailQuery: () => ({
    data: { specs: { hypervisor_type: detailLoading ? null : detailHypervisor } },
    isLoading: false,
    isPlaceholderData: detailLoading,
  }),
}))

// The instance the menu passes carries the current flavor as a { id, name } ref
// (list Instance shape); the modal seeds the current flavor from it.
const instance = {
  id: "s1",
  name: "web-01",
  flavor: { id: "f1", name: "m1.small" },
} as Instance

function renderModal(resizeInstance = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <ResizeModal
        instance={instance}
        apiClient={{ instances: { resizeInstance } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { resizeInstance, onClose }
}

describe("ResizeModal", () => {
  beforeEach(() => {
    detailHypervisor = "kvm"
    detailLoading = false
  })

  it("shows the current flavor name read-only", () => {
    renderModal()
    expect(screen.getByText(/m1\.small/)).toBeInTheDocument()
  })

  it("shows the current flavor's hypervisor type (from the instance detail) next to its name", () => {
    // The type comes from the instance detail's server flavor, which carries the
    // real hypervisor even when the flavor catalog omits it. Here the detail says
    // vmware while catalog f1 is kvm — the line must reflect the detail (vmware).
    detailHypervisor = "vmware"
    renderModal()
    expect(screen.getByText(/m1\.small \(vmware\)/)).toBeInTheDocument()
  })

  it("shows 'unknown' when the instance detail has no hypervisor type", () => {
    detailHypervisor = null
    renderModal()
    expect(screen.getByText(/m1\.small \(unknown\)/)).toBeInTheDocument()
  })

  it("shows a loading spinner (not 'unknown') while the instance detail is still loading", () => {
    // While the detail query is loading we don't yet know the hypervisor type;
    // showing "unknown" would be misleading — show the shared loading indicator
    // next to the flavor name instead, like the detail Specs tab.
    detailLoading = true
    renderModal()
    expect(screen.queryByText(/\(unknown\)/)).not.toBeInTheDocument()
    expect(document.querySelectorAll(".spinner").length).toBeGreaterThan(0)
  })

  it("disables the flavor dropdown until the hypervisor type is known", () => {
    // Until the detail resolves the hypervisor type, we cannot filter targets by
    // it; offering an unfiltered list would let the user pick a cross-hypervisor
    // flavor. Keep the dropdown disabled (greyed out) in the meantime.
    detailLoading = true
    renderModal()
    expect(screen.getByText(/choose flavor/i)).toBeDisabled()
  })

  it("keeps Resize disabled until a different flavor is chosen", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /^resize$/i })).toBeDisabled()
  })

  it("does not offer the current flavor as a choice", () => {
    renderModal()
    fireEvent.click(screen.getByText(/choose flavor/i))
    // The dropdown lists m1.large but not m1.small (current flavor is removed).
    expect(screen.queryByRole("option", { name: /m1\.large/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /m1\.small/ })).not.toBeInTheDocument()
  })

  it("only offers flavors of the same hypervisor type as the current flavor", () => {
    // Current flavor f1 is kvm; the vmware flavor (v1.large) must not be offered,
    // because a resize cannot move a server across hypervisor types.
    renderModal()
    fireEvent.click(screen.getByText(/choose flavor/i))
    expect(screen.queryByRole("option", { name: /m1\.large/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /v1\.large/ })).not.toBeInTheDocument()
  })

  it("filters resize targets by the instance detail's hypervisor type, not the catalog lookup", () => {
    // The instance runs on vmware (per the detail). Its current flavor's catalog
    // entry (f1) reads kvm here — a mismatch that happens when the passed-in
    // flavor id doesn't resolve cleanly in the catalog. The filter must follow
    // the detail (vmware): only the vmware flavor (v1.large) may be offered, and
    // the kvm flavors (m1.large) must be hidden.
    detailHypervisor = "vmware"
    renderModal()
    fireEvent.click(screen.getByText(/choose flavor/i))
    expect(screen.queryByRole("option", { name: /v1\.large/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /m1\.large/ })).not.toBeInTheDocument()
  })

  it("resizes to the chosen flavor and closes", async () => {
    const { resizeInstance, onClose } = renderModal()
    fireEvent.click(screen.getByText(/choose flavor/i))
    fireEvent.click(screen.getByRole("option", { name: /m1\.large/ }))
    fireEvent.click(screen.getByRole("button", { name: /^resize$/i }))
    await waitFor(() => expect(resizeInstance).toHaveBeenCalledWith("s1", "f2"))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("surfaces a resize error", async () => {
    const resizeInstance = vi.fn().mockRejectedValue(new Error("resize failed"))
    renderModal(resizeInstance)
    fireEvent.click(screen.getByText(/choose flavor/i))
    fireEvent.click(screen.getByRole("option", { name: /m1\.large/ }))
    fireEvent.click(screen.getByRole("button", { name: /^resize$/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent("resize failed")
  })
})
