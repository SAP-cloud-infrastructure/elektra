import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { ResetStatusModal } from "./ResetStatusModal"

function renderModal(opts: { resetStatus?: ReturnType<typeof vi.fn>; onClose?: ReturnType<typeof vi.fn> } = {}) {
  const resetStatus = opts.resetStatus ?? vi.fn().mockResolvedValue(undefined)
  const onClose = opts.onClose ?? vi.fn()
  const qc = new QueryClient()
  const result = render(
    <QueryClientProvider client={qc}>
      <ResetStatusModal
        instance={{ id: "s1", name: "web-01" } as Instance}
        apiClient={{ instances: { resetStatus } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { ...result, resetStatus, onClose }
}

describe("ResetStatusModal", () => {
  it("resets to the chosen state and closes", async () => {
    const { resetStatus, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: "error" } })
    fireEvent.click(screen.getByRole("button", { name: /reset/i }))
    await waitFor(() => expect(resetStatus).toHaveBeenCalledWith("s1", "error"))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("defaults to resetting to active", async () => {
    const { resetStatus } = renderModal()
    fireEvent.click(screen.getByRole("button", { name: /reset/i }))
    await waitFor(() => expect(resetStatus).toHaveBeenCalledWith("s1", "active"))
  })
})
