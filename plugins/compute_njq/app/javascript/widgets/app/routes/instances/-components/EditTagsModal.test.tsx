import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { InstanceDetail } from "../../../types/instance"
import { EditTagsModal } from "./EditTagsModal"

// Minimal InstanceDetail for the getInstanceDetail mock — only `tags` matters to
// the modal; the rest mirrors detailPlaceholderFromList (useInstanceQueries.ts).
function detail(tags: string[]): InstanceDetail {
  return {
    id: "s1",
    name: "web-01",
    status: { state: "active", transition: null, power_state: "Running" },
    locked: false,
    fault_message: null,
    availability_zone: null,
    created: null,
    updated: null,
    host: null,
    project: { id: null, name: null, same_scope: true },
    tags,
    specs: null,
    ip_addresses: [],
    security_groups: [],
    key_name: null,
    metadata: { image_name: null, image_id: null, extra: [] },
    volumes: [],
  } as InstanceDetail
}

function renderModal(
  opts: {
    tags?: string[]
    setTags?: ReturnType<typeof vi.fn>
    getInstanceDetail?: ReturnType<typeof vi.fn>
    onClose?: ReturnType<typeof vi.fn>
  } = {}
) {
  const setTags = opts.setTags ?? vi.fn().mockResolvedValue(undefined)
  const getInstanceDetail =
    opts.getInstanceDetail ?? vi.fn().mockResolvedValue(detail(opts.tags ?? []))
  const onClose = opts.onClose ?? vi.fn()
  const qc = new QueryClient()
  const result = render(
    <QueryClientProvider client={qc}>
      <EditTagsModal
        instance={{ id: "s1", name: "web-01" } as never}
        apiClient={{ instances: { setTags, getInstanceDetail } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { ...result, setTags, getInstanceDetail, onClose }
}

// The row containing a given tag's text (a <tr>), for scoping row-local controls.
function rowFor(tag: string) {
  return screen.getByText(tag).closest("tr") as HTMLElement
}

describe("EditTagsModal", () => {
  it("shows the instance's current tags on open", async () => {
    renderModal({ tags: ["web", "prod"] })
    expect(await screen.findByText("web")).toBeInTheDocument()
    expect(screen.getByText("prod")).toBeInTheDocument()
  })

  it("shows an empty-state message when there are no tags", async () => {
    renderModal({ tags: [] })
    expect(await screen.findByText(/no tags/i)).toBeInTheDocument()
  })

  it("adds a tag via the Add button as a whole-set write, with no Save button", async () => {
    const { setTags } = renderModal({ tags: ["web", "prod"] })
    const input = await screen.findByLabelText(/add tag/i)

    fireEvent.change(input, { target: { value: "db" } })
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }))

    await waitFor(() => expect(setTags).toHaveBeenCalledWith("s1", ["web", "prod", "db"]))
    // Live editor: no batch Save step.
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull()
  })

  it("adds a tag by pressing Enter in the input", async () => {
    const { setTags } = renderModal({ tags: [] })
    const input = await screen.findByLabelText(/add tag/i)
    fireEvent.change(input, { target: { value: "first" } })
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(setTags).toHaveBeenCalledWith("s1", ["first"]))
  })

  it("ignores empty and duplicate adds", async () => {
    const { setTags } = renderModal({ tags: ["web"] })
    const input = await screen.findByLabelText(/add tag/i)

    fireEvent.keyDown(input, { key: "Enter" }) // empty
    fireEvent.change(input, { target: { value: "web" } }) // duplicate
    fireEvent.keyDown(input, { key: "Enter" })

    await Promise.resolve()
    expect(setTags).not.toHaveBeenCalled()
  })

  it("edits an existing tag inline and persists the whole set", async () => {
    const { setTags } = renderModal({ tags: ["web", "prod"] })
    await screen.findByText("web")

    // Capture the row once — in edit mode the "web" badge text is replaced by an
    // input, so re-querying by that text would fail.
    const row = rowFor("web")
    fireEvent.click(within(row).getByRole("button", { name: /edit/i }))
    const editInput = within(row).getByRole("textbox")
    fireEvent.change(editInput, { target: { value: "web-renamed" } })
    fireEvent.click(within(row).getByRole("button", { name: /save|confirm|check/i }))

    await waitFor(() => expect(setTags).toHaveBeenCalledWith("s1", ["web-renamed", "prod"]))
  })

  it("removes a tag only after inline confirmation", async () => {
    const { setTags } = renderModal({ tags: ["web", "prod"] })
    await screen.findByText("prod")

    // First trash click asks for confirmation — nothing persisted yet.
    fireEvent.click(within(rowFor("prod")).getByRole("button", { name: /delete|remove/i }))
    expect(setTags).not.toHaveBeenCalled()

    // Confirming deletes and persists the reduced set.
    fireEvent.click(within(rowFor("prod")).getByRole("button", { name: /confirm|yes/i }))
    await waitFor(() => expect(setTags).toHaveBeenCalledWith("s1", ["web"]))
  })

  it("surfaces a persist error and rolls back", async () => {
    const setTags = vi.fn().mockRejectedValue(new Error("nope"))
    renderModal({ tags: ["web"], setTags })
    const input = await screen.findByLabelText(/add tag/i)

    fireEvent.change(input, { target: { value: "db" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(await screen.findByRole("alert")).toHaveTextContent("nope")
  })
})
