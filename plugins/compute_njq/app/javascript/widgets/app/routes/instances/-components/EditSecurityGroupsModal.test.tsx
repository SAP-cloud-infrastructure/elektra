import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const mutate = vi.fn()
let mutationError: Error | null = null
vi.mock("../../../hooks/useEditSecurityGroupsMutation", () => ({
  useEditSecurityGroupsMutation: () => ({ mutate, isPending: false, error: mutationError }),
}))
let optionsLoading = false
vi.mock("../../../hooks/useSecurityGroupOptionsQuery", () => ({
  useSecurityGroupOptionsQuery: () => ({
    data: optionsLoading
      ? undefined
      : [
          { id: "sg-a", name: "web", project_id: "p", project_label: "d/p" },
          { id: "sg-b", name: "db", project_id: "p", project_label: "d/p" },
        ],
    isLoading: optionsLoading,
  }),
}))

// The modal reads the instance's current SGs from the detail query to
// preselect them. Each test overrides this via `detailSecurityGroups`.
let detailSecurityGroups: Array<{ id: string | null; name: string | null }> = []
let detailIsPlaceholder = false
vi.mock("../../../hooks/useInstanceQueries", () => ({
  useInstanceDetailQuery: () => ({
    data: { id: "s1", security_groups: detailSecurityGroups },
    isLoading: false,
    isPlaceholderData: detailIsPlaceholder,
  }),
}))

import { EditSecurityGroupsModal } from "./EditSecurityGroupsModal"

function renderModal(onClose: () => void = vi.fn()) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <EditSecurityGroupsModal instance={{ id: "s1" } as never} apiClient={{} as never} onClose={onClose} />
    </QueryClientProvider>
  )
}

describe("EditSecurityGroupsModal", () => {
  beforeEach(() => {
    mutate.mockClear()
    mutationError = null
    detailSecurityGroups = [{ id: "sg-a", name: "web" }]
    detailIsPlaceholder = false
    optionsLoading = false
  })

  it("preselects the instance's current security groups", () => {
    renderModal()
    // The current group "web" shows as a selected chip in the MultiSelect trigger.
    expect(screen.getByText("web")).toBeInTheDocument()
  })

  it("locks the picker and Save while options are loading", () => {
    optionsLoading = true
    renderModal()
    // The picker trigger is present but disabled until everything has loaded.
    const picker = document.getElementById("edit-sg-select")
    expect(picker).toBeDisabled()
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })

  it("locks the picker and Save while the detail is still a placeholder", () => {
    detailIsPlaceholder = true
    renderModal()
    const picker = document.getElementById("edit-sg-select")
    expect(picker).toBeDisabled()
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })

  it("seeds the selection from the real detail, not the empty list placeholder", () => {
    // The detail query first serves a placeholder built from the list row, which
    // carries no security groups. Seeding from that would leave the picker empty
    // even after the real aggregated detail (with SGs) arrives.
    detailIsPlaceholder = true
    detailSecurityGroups = []
    const { rerender } = renderModal()
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()

    // Real detail arrives with the instance's current SGs.
    detailIsPlaceholder = false
    detailSecurityGroups = [{ id: "sg-a", name: "web" }]
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <EditSecurityGroupsModal instance={{ id: "s1" } as never} apiClient={{} as never} onClose={vi.fn()} />
      </QueryClientProvider>
    )
    expect(screen.getByText("web")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^save$/i })).toBeEnabled()
  })

  it("disables Save when the selection is empty", () => {
    detailSecurityGroups = []
    renderModal()
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })

  it("saves the selected security groups and closes on success", async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const [vars, opts] = mutate.mock.calls[0]
    expect(vars).toEqual({ id: "s1", security_groups: ["sg-a"] })
    // onSuccess closes the modal.
    opts.onSuccess()
    expect(onClose).toHaveBeenCalled()
  })

  it("keeps the modal open and shows the error when the save fails", () => {
    mutationError = new Error("Boom")
    renderModal()
    expect(screen.getByRole("alert")).toHaveTextContent("Boom")
  })

  it("ignores a null security-group id when preselecting", () => {
    detailSecurityGroups = [{ id: null, name: "phantom" }]
    renderModal()
    // A null id can't be a real selection, so Save stays disabled.
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })
})
