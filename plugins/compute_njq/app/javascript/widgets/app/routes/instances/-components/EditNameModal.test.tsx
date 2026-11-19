import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { EditNameModal } from "./EditNameModal"

function instance(over: Partial<Instance> = {}): Instance {
  return { id: "s1", name: "web-01" } as Instance & typeof over
}

function renderModal(opts: { updateName?: ReturnType<typeof vi.fn>; onClose?: ReturnType<typeof vi.fn> } = {}) {
  const updateName = opts.updateName ?? vi.fn().mockResolvedValue(undefined)
  const onClose = opts.onClose ?? vi.fn()
  const qc = new QueryClient()
  const result = render(
    <QueryClientProvider client={qc}>
      <EditNameModal
        instance={instance()}
        apiClient={{ instances: { updateName } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { ...result, updateName, onClose }
}

describe("EditNameModal", () => {
  it("saves the trimmed new name and closes", async () => {
    const { updateName, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: " web-02 " } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    await waitFor(() => expect(updateName).toHaveBeenCalledWith("s1", "web-02"))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("disables Save when the name is empty, whitespace-only or unchanged", () => {
    renderModal()
    const save = screen.getByRole("button", { name: /save/i })
    expect(save).toBeDisabled() // unchanged ("web-01")
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } })
    expect(save).toBeDisabled() // whitespace only
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "web-02" } })
    expect(save).not.toBeDisabled()
  })
})
