import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { SnapshotModal } from "./SnapshotModal"

// Control the polled status per test.
let polledStatus = "saving"
let polledError: Error | null = null
vi.mock("../../../hooks/useImageStatusQuery", async (orig) => {
  const actual = (await orig()) as object
  return {
    ...actual,
    useImageStatusQuery: (_api: unknown, imageId: string | null, opts: { enabled: boolean }) => ({
      data: opts.enabled && imageId && !polledError ? { id: imageId, name: "snap-1", status: polledStatus } : undefined,
      isError: opts.enabled && imageId ? !!polledError : false,
      error: polledError,
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
    polledError = null
  })

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

  it("moves to a progress state after submit and does NOT close", async () => {
    const { createSnapshot, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1"))
    // Progress indicator shows; modal stays open.
    await waitFor(() => expect(document.querySelectorAll(".spinner").length).toBeGreaterThan(0))
    expect(onClose).not.toHaveBeenCalled()
  })

  it("tells the user they may close the dialog while the snapshot finishes in the background", async () => {
    const { createSnapshot } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalled())
    expect(await screen.findByText(/close this dialog/i)).toBeInTheDocument()
    expect(screen.getByText(/in the background/i)).toBeInTheDocument()
    expect(screen.getByText(/snapshots/i)).toBeInTheDocument()
  })

  it("names the snapshot in the progress message", async () => {
    const { createSnapshot } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalled())
    const progress = await screen.findByRole("status")
    expect(progress).toHaveTextContent("snap-1")
  })

  it("shows only a Close button (no Cancel) once the snapshot is running in the background", async () => {
    const { createSnapshot } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalled())
    // The footer button reads "Close" (not "Cancel") while the snapshot runs.
    // (The modal header's X carries aria-label="Close" too, so scope to the footer btn.)
    const footerButtons = Array.from(document.querySelectorAll("button.btn-secondary"))
    expect(footerButtons.map((b) => b.textContent)).toContain("Close")
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
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

  it("lands in the error state (never creating) when no image id comes back", async () => {
    const createSnapshot = vi.fn().mockResolvedValue({ image_id: null })
    renderModal(createSnapshot)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    // Must not be stuck showing progress.
    expect(document.querySelectorAll(".spinner").length).toBe(0)
  })

  it("lands in the error state when the status poll itself fails (no infinite progress)", async () => {
    polledError = new Error("image status unavailable")
    renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(document.querySelectorAll(".spinner").length).toBe(0)
  })
})
