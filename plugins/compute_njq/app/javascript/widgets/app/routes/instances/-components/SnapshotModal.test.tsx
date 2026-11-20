import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { SnapshotModal } from "./SnapshotModal"

const instance = { id: "s1", name: "web-01" } as Instance

function renderModal(createSnapshot = vi.fn().mockResolvedValue({ image_id: "img-7" })) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <SnapshotModal
        instance={instance}
        apiClient={{ instances: { createSnapshot } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { createSnapshot, onClose }
}

describe("SnapshotModal", () => {
  it("keeps Create disabled until a name is entered", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /create snapshot/i })).toBeDisabled()
  })

  it("explains what a snapshot is on the form", () => {
    renderModal()
    expect(
      screen.getByText("A snapshot is an image which preserves the disk state of a running instance.")
    ).toBeInTheDocument()
  })

  it("fires the snapshot and closes the modal on a successful submit", async () => {
    const { createSnapshot, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1"))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("keeps the modal open and shows the error on a failed submit", async () => {
    const createSnapshot = vi.fn().mockRejectedValue(new Error("quota exceeded"))
    const { onClose } = renderModal(createSnapshot)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent("quota exceeded")
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
