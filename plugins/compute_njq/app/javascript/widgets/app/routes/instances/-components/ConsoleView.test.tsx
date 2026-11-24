import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const refetch = vi.fn()
let queryState: { data?: unknown; isLoading: boolean; isError: boolean; error?: Error } = {
  data: { url: "https://c.cloud.sap/vnc?token=x", type: "novnc", protocol: "vnc" },
  isLoading: false,
  isError: false,
}
vi.mock("../../../hooks/useInstanceConsoleQuery", () => ({
  useInstanceConsoleQuery: () => ({ ...queryState, refetch }),
}))

const actionMutate = vi.fn()
vi.mock("../../../hooks/useInstanceActionMutation", () => ({
  useInstanceActionMutation: () => ({ mutate: actionMutate, isPending: false }),
}))

const policyState = vi.hoisted(() => ({ allowed: true }))
vi.mock("lib/policy", () => ({ policy: { isAllowed: () => policyState.allowed } }))

const confirmMock = vi.fn((_message: unknown, _options?: unknown) => Promise.resolve())
vi.mock("lib/dialogs", () => ({ confirm: (m: unknown, o?: unknown) => confirmMock(m, o) }))

import { ConsoleView } from "./ConsoleView"

function renderView(props: Partial<Parameters<typeof ConsoleView>[0]> = {}) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <ConsoleView instanceId="s1" name="web-01" apiClient={{} as never} onClose={onClose} {...props} />
    </QueryClientProvider>
  )
  return { onClose }
}

describe("ConsoleView", () => {
  beforeEach(() => {
    refetch.mockClear()
    actionMutate.mockClear()
    confirmMock.mockClear()
    confirmMock.mockReturnValue(Promise.resolve())
    policyState.allowed = true
    queryState = {
      data: { url: "https://c.cloud.sap/vnc?token=x", type: "novnc", protocol: "vnc" },
      isLoading: false,
      isError: false,
    }
  })

  it("renders the console iframe when loaded", () => {
    renderView()
    expect(screen.getByText(/web-01/)).toBeInTheDocument()
    expect(document.querySelector("iframe")).toHaveAttribute("src", "https://c.cloud.sap/vnc?token=x")
  })

  it("shows a connecting spinner while loading", () => {
    queryState = { isLoading: true, isError: false }
    renderView()
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(document.querySelector("iframe")).not.toBeInTheDocument()
  })

  it("shows the error on failure and reconnects on Reconnect", () => {
    queryState = { isLoading: false, isError: true, error: new Error("No console available") }
    renderView()
    expect(screen.getByRole("alert")).toHaveTextContent("No console available")
    fireEvent.click(screen.getByRole("button", { name: /reconnect/i }))
    expect(refetch).toHaveBeenCalled()
  })

  it("renders a New tab link only when newTabHref is given", () => {
    renderView({ newTabHref: "/base/console/s1" })
    const link = screen.getByRole("link", { name: /new tab/i })
    expect(link).toHaveAttribute("href", "/base/console/s1")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("omits the New tab link when newTabHref is absent (full-page view)", () => {
    renderView()
    expect(screen.queryByRole("link", { name: /new tab/i })).not.toBeInTheDocument()
  })

  it("hard resets after confirming, gated by policy", async () => {
    renderView()
    fireEvent.click(screen.getByRole("button", { name: /hard reset/i }))
    expect(confirmMock).toHaveBeenCalled()
    await waitFor(() =>
      expect(actionMutate).toHaveBeenCalledWith({
        id: "s1",
        actionName: "hard_reset",
        optimisticTransition: "rebooting",
      })
    )
  })

  it("hides Hard Reset when the policy denies it", () => {
    policyState.allowed = false
    renderView()
    expect(screen.queryByRole("button", { name: /hard reset/i })).not.toBeInTheDocument()
  })

  it("calls onClose when Close is clicked", () => {
    const { onClose } = renderView()
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
