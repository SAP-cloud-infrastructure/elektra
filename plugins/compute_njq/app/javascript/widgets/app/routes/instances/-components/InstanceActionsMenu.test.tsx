import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
vi.mock("lib/policy", () => ({ policy: { isAllowed: () => true } }))

const action = vi.fn().mockResolvedValue(undefined)
import InstanceActionsMenu from "./InstanceActionsMenu"
import type { Instance } from "../../../types/instance"

const instance: Instance = {
  id: "s1",
  name: "x",
  locked: false,
  status: { state: "active", transition: null, power_state: "Running" },
  flavor: { id: null, name: null },
  image: { id: null, name: null },
  ips: [],
  created: null,
} as Instance

function renderMenu(over: Partial<Instance> = {}) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <InstanceActionsMenu
        instance={{ ...instance, ...over } as Instance}
        scope={{}}
        apiClient={{ instances: { action, terminate: vi.fn() } } as never}
      />
    </QueryClientProvider>
  )
}

describe("InstanceActionsMenu", () => {
  beforeEach(() => {
    action.mockClear()
  })

  it("opens a confirm dialog for a confirm action and fires on confirm", async () => {
    renderMenu()
    fireEvent.click(screen.getByText("Stop"))
    expect(screen.getByText("Yes, stop it")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Yes, stop it"))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "stop"))
  })

  it("fires a non-confirm action immediately without a dialog", async () => {
    // Start (parked-only, no confirm) must fire the mutation on click with no
    // confirmation dialog in between.
    renderMenu({ status: { state: "stopped", transition: null, power_state: "Shut off" } })
    fireEvent.click(screen.getByText("Start"))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "start"))
  })

  it("renders nothing when there are no visible actions (transitioning)", () => {
    const { container } = renderMenu({
      status: { state: "active", transition: "rebooting", power_state: "Running" },
    })
    expect(container).toBeEmptyDOMElement()
  })
})
