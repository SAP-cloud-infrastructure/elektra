import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { ResizeModal } from "./ResizeModal"

const flavorData = [
  { id: "f1", name: "m1.small", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
  { id: "f2", name: "m1.large", vcpus: 4, ram: 8192, disk: 80, hypervisor_type: "kvm", is_public: true },
]
vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: flavorData, isLoading: false }),
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
  it("shows the current flavor name read-only", () => {
    renderModal()
    expect(screen.getByText("m1.small")).toBeInTheDocument()
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
