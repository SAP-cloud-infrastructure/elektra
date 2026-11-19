import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { SnapshotModal } from "./SnapshotModal"

// Control the polled status per test.
let polledStatus = "saving"
vi.mock("../../../hooks/useImageStatusQuery", async (orig) => {
  const actual = (await orig()) as object
  return {
    ...actual,
    useImageStatusQuery: (_api: unknown, imageId: string | null, opts: { enabled: boolean }) => ({
      data: opts.enabled && imageId ? { id: imageId, name: "snap-1", status: polledStatus } : undefined,
    }),
  }
})

const instance = { id: "s1", name: "web-01" } as Instance

function renderModal(createSnapshot = vi.fn().mockResolvedValue({ image_id: "img-7" })) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <SnapshotModal
        instance={instance}
        apiClient={{ instances: { createSnapshot }, images: { getStatus: vi.fn() } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { createSnapshot, onClose }
}

describe("SnapshotModal", () => {
  beforeEach(() => {
    polledStatus = "saving"
  })

  it("keeps Create disabled until a name is entered", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /create snapshot/i })).toBeDisabled()
  })

  it("moves to a progress state after submit and does NOT close", async () => {
    const { createSnapshot, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1"))
    // Progress indicator shows; modal stays open.
    await waitFor(() => expect(document.querySelectorAll(".spinner").length).toBeGreaterThan(0))
    expect(onClose).not.toHaveBeenCalled()
  })

  it("shows a success state when the image becomes active", async () => {
    polledStatus = "active"
    const { onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByText(/snapshot ready/i)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("shows an error state when the image ends in a failure status", async () => {
    polledStatus = "error"
    renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("surfaces a create error and stays on the form", async () => {
    const createSnapshot = vi.fn().mockRejectedValue(new Error("quota exceeded"))
    renderModal(createSnapshot)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent("quota exceeded")
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })
})
