import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// The console body is covered by ConsoleView.test; here we only exercise the
// panel chrome (slide/backdrop/close), so stub ConsoleView to a marker that
// surfaces the close affordance and the New tab href it receives.
vi.mock("./ConsoleView", () => ({
  ConsoleView: ({ name, onClose, newTabHref }: { name: string; onClose: () => void; newTabHref?: string }) => (
    <div data-testid="console-view" data-newtab={newTabHref}>
      <span>{name}</span>
      <button type="button" onClick={onClose}>
        inner close
      </button>
    </div>
  ),
}))

import { WebConsolePanel } from "./WebConsolePanel"

function renderPanel(instance: { id: string; name: string | null } | null, onClose = vi.fn()) {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <WebConsolePanel
        instance={instance as never}
        apiClient={{} as never}
        onClose={onClose}
        consoleHref={(id: string) => `/base/console/${id}`}
      />
    </QueryClientProvider>
  )
  return { onClose }
}

describe("WebConsolePanel", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when no instance is open", () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <WebConsolePanel instance={null} apiClient={{} as never} onClose={vi.fn()} consoleHref={() => ""} />
      </QueryClientProvider>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders the console view with the instance name and the full-page console href", () => {
    renderPanel({ id: "s1", name: "web-01" })
    const view = screen.getByTestId("console-view")
    expect(view).toHaveTextContent("web-01")
    expect(view).toHaveAttribute("data-newtab", "/base/console/s1")
  })

  it("closes (after sliding out) when the inner close is clicked", async () => {
    const { onClose } = renderPanel({ id: "s1", name: "web-01" })
    fireEvent.click(screen.getByRole("button", { name: /inner close/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
