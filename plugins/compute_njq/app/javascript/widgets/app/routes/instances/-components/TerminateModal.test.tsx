import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { TerminateModal } from "./TerminateModal"

function renderModal(
  opts: { terminate?: (id: string) => Promise<void>; onClose?: () => void; name?: string | null } = {}
) {
  const terminate = opts.terminate ?? vi.fn().mockResolvedValue(undefined)
  const onClose = opts.onClose ?? vi.fn()
  const qc = new QueryClient()
  const result = render(
    <QueryClientProvider client={qc}>
      <TerminateModal
        instance={{ id: "s1", name: opts.name === undefined ? "web-01" : opts.name } as Instance}
        apiClient={{ instances: { terminate } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { ...result, terminate, onClose }
}

describe("TerminateModal", () => {
  it("keeps the terminate button disabled until the exact name is typed", () => {
    renderModal()
    const button = screen.getByRole("button", { name: /terminate instance/i })
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/instance name/i), { target: { value: "web-0" } })
    expect(button).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/instance name/i), { target: { value: "web-01" } })
    expect(button).not.toBeDisabled()
  })

  it("ignores surrounding whitespace when matching the name", () => {
    renderModal()
    fireEvent.change(screen.getByLabelText(/instance name/i), { target: { value: "  web-01  " } })
    expect(screen.getByRole("button", { name: /terminate instance/i })).not.toBeDisabled()
  })

  it("terminates and closes on confirm", async () => {
    const { terminate, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/instance name/i), { target: { value: "web-01" } })
    fireEvent.click(screen.getByRole("button", { name: /terminate instance/i }))
    await waitFor(() => expect(terminate).toHaveBeenCalledWith("s1"))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("keeps the modal open and shows the error when terminate fails", async () => {
    const terminate = vi.fn().mockRejectedValue(new Error("Boom"))
    const onClose = vi.fn()
    renderModal({ terminate, onClose })
    fireEvent.change(screen.getByLabelText(/instance name/i), { target: { value: "web-01" } })
    fireEvent.click(screen.getByRole("button", { name: /terminate instance/i }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Boom"))
    expect(onClose).not.toHaveBeenCalled()
  })

  it("falls back to the instance id when the name is empty", () => {
    renderModal({ name: null })
    fireEvent.change(screen.getByLabelText(/instance name/i), { target: { value: "s1" } })
    expect(screen.getByRole("button", { name: /terminate instance/i })).not.toBeDisabled()
  })
})
