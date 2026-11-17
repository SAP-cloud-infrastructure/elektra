import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
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

function renderModal(dq: UseQueryResult<InstanceDetail, Error>) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <InstanceModal
        detailQuery={dq}
        metricsQuery={metricsQuery}
        onClose={() => {}}
        activeTab="Information"
        onTabChange={() => {}}
        apiClient={{ instances: { action: vi.fn(), terminate: vi.fn() } } as never}
      />
    </QueryClientProvider>
  )
}

describe("InstanceModal lifecycle actions", () => {
  it("renders the actions dropdown in the header when the instance is loaded", () => {
    renderModal(detailQuery())
    expect(screen.getByRole("button", { name: /actions/i })).toBeInTheDocument()
  })

  it("does not render the actions dropdown while the detail is loading", () => {
    renderModal(detailQuery({ data: undefined, isLoading: true }))
    expect(screen.queryByRole("button", { name: /actions/i })).toBeNull()
  })
})
