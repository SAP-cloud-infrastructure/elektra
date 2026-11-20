import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
vi.mock("lib/policy", () => ({ policy: { isAllowed: () => true } }))

import { InstanceModal } from "./InstanceModal"
import type { InstanceDetail, InstanceMetrics } from "../../../types/instance"

const detail = {
  id: "s1",
  name: "web-01",
  locked: false,
  status: { state: "active", transition: null, power_state: "Running" },
  // Minimal fields the Information tab reads so it renders without crashing;
  // the test only asserts on the header actions dropdown.
  availability_zone: null,
  created: null,
  updated: null,
  host: null,
  project: { id: "p1", name: "demo", same_scope: true },
  tags: [],
} as unknown as InstanceDetail

// Minimal UseQueryResult stubs: only the fields InstanceModal reads.
function detailQuery(over: Partial<UseQueryResult<InstanceDetail, Error>> = {}) {
  return {
    data: detail,
    isLoading: false,
    isError: false,
    error: null,
    isPlaceholderData: false,
    ...over,
  } as UseQueryResult<InstanceDetail, Error>
}
const metricsQuery = {
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
} as unknown as UseQueryResult<InstanceMetrics, Error>

function renderModal(dq: UseQueryResult<InstanceDetail, Error>, action = vi.fn().mockResolvedValue(undefined)) {
  const qc = new QueryClient()
  const result = render(
    <QueryClientProvider client={qc}>
      <InstanceModal
        detailQuery={dq}
        metricsQuery={metricsQuery}
        onClose={() => {}}
        activeTab="Information"
        onTabChange={() => {}}
        apiClient={{ instances: { action, terminate: vi.fn() } } as never}
      />
    </QueryClientProvider>
  )
  return { ...result, action }
}

// A running instance exposes confirm actions (Stop/Reboot/…) in the header menu.
function runningDetail() {
  return detailQuery({
    data: { ...detail, status: { state: "active", transition: null, power_state: "Running" } } as InstanceDetail,
  })
}

describe("InstanceModal lifecycle actions", () => {
  it("renders the actions dropdown in the header when the instance is loaded", () => {
    renderModal(detailQuery())
    expect(screen.getByRole("button", { name: /actions/i })).toBeInTheDocument()
  })

  it("omits list-only actions (Resize, Create Snapshot, Edit Name/Tags) from the detail header menu", () => {
    // The detail modal mounts the shared menu with surface="detail", so it
    // shows only VM lifecycle operations. Resize, Create Snapshot and the edit
    // actions are list-only and must not appear here; Stop still does.
    renderModal(runningDetail())
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    expect(screen.queryByText("Resize")).not.toBeInTheDocument()
    expect(screen.queryByText("Create Snapshot")).not.toBeInTheDocument()
    expect(screen.queryByText("Edit Name")).not.toBeInTheDocument()
    expect(screen.queryByText("Edit Tags")).not.toBeInTheDocument()
    expect(screen.getByText("Stop")).toBeInTheDocument()
  })

  it("does not render the actions dropdown while the detail is loading", () => {
    renderModal(detailQuery({ data: undefined, isLoading: true }))
    expect(screen.queryByRole("button", { name: /actions/i })).toBeNull()
  })

  it("shows the status pill to the left of the actions cog in the header", () => {
    renderModal(runningDetail())
    const toggle = screen.getByRole("button", { name: /actions/i })
    const pill = document.querySelector(".status-pill")
    expect(pill).not.toBeNull()
    // Pill and cog share a flex row; the pill precedes the cog in DOM order.
    const row = toggle.closest(".d-flex")!
    expect(row.contains(pill)).toBe(true)
    expect(pill!.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("confirms a destructive action with an inline banner, not a second modal", async () => {
    const { action } = renderModal(runningDetail())
    const backdropsBefore = document.querySelectorAll(".modal-backdrop").length

    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))

    // The consequence text appears inline in a banner; no new backdrop is added.
    const banner = screen.getByRole("alert")
    expect(banner).toHaveTextContent("Stop instance?")
    expect(banner).toHaveTextContent(/shuts down the guest OS/)
    expect(document.querySelectorAll(".modal-backdrop").length).toBe(backdropsBefore)
    expect(action).not.toHaveBeenCalled()

    // Confirming fires the mutation and clears the banner.
    fireEvent.click(screen.getByRole("button", { name: "Stop instance" }))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "stop"))
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("cancels an inline confirmation without firing the action", () => {
    const { action } = renderModal(runningDetail())
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))
    expect(screen.getByRole("alert")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("alert")).toBeNull()
    expect(action).not.toHaveBeenCalled()
  })
})
