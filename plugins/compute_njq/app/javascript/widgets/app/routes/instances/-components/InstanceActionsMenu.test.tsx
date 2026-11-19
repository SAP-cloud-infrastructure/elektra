import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
const policyState = vi.hoisted(() => ({ allowed: true }))
vi.mock("lib/policy", () => ({ policy: { isAllowed: () => policyState.allowed } }))

// Mock the shared Elektra confirm dialog: capture its message/options and let a
// test resolve (user confirms) or reject (user cancels) the returned promise.
let confirmDeferred: { resolve: () => void; reject: () => void }
const confirmMock = vi.fn((_message: unknown, _options?: unknown) => {
  return new Promise<void>((resolve, reject) => {
    confirmDeferred = { resolve, reject }
  })
})
vi.mock("lib/dialogs", () => ({ confirm: (m: unknown, o?: unknown) => confirmMock(m, o) }))

const action = vi.fn().mockResolvedValue(undefined)
import InstanceActionsMenu from "./InstanceActionsMenu"
import type { InstanceAction } from "./instanceActions"
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

function renderMenu(over: Partial<Instance> = {}, onConfirmRequest?: (a: InstanceAction, run: () => void) => void) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <InstanceActionsMenu
        instance={{ ...instance, ...over } as Instance}
        scope={{}}
        apiClient={{ instances: { action, terminate: vi.fn() } } as never}
        onConfirmRequest={onConfirmRequest}
      />
    </QueryClientProvider>
  )
}

describe("InstanceActionsMenu", () => {
  beforeEach(() => {
    action.mockClear()
    confirmMock.mockClear()
  })

  it("keeps the menu closed until the toggle is clicked", () => {
    renderMenu()
    const toggle = screen.getByRole("button", { name: /actions/i })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(document.querySelector(".dropdown-menu.show")).toBeNull()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(document.querySelector(".dropdown-menu.show")).not.toBeNull()
  })

  it("opens the shared confirm dialog for a confirm action and fires on confirm", async () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))
    // Delegates to the shared lib/dialogs confirm with the action's consequence
    // message, a short title, and a verb button label.
    expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining("shuts down the guest OS"), {
      title: "Stop instance?",
      confirmLabel: "Stop instance",
      abortLabel: "Cancel",
    })
    // Menu closes immediately; the dialog (portal) drives the rest.
    expect(document.querySelector(".dropdown-menu.show")).toBeNull()
    expect(action).not.toHaveBeenCalled()

    confirmDeferred.resolve()
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "stop"))
  })

  it("does not fire a confirm action when the dialog is cancelled", async () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))
    expect(action).not.toHaveBeenCalled()

    confirmDeferred.reject()
    // Give the rejected promise a tick to settle; nothing should fire.
    await Promise.resolve()
    expect(action).not.toHaveBeenCalled()
  })

  it("fires a non-confirm action immediately without a dialog", async () => {
    // Start (parked-only, no confirm) must fire the mutation on click with no
    // confirmation dialog in between.
    renderMenu({ status: { state: "stopped", transition: null, power_state: "Shut off" } })
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Start"))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "start"))
  })

  it("shows a disabled toggle with a tooltip while transitioning (not hidden)", () => {
    renderMenu({ status: { state: "active", transition: "rebooting", power_state: "Running" } })
    const toggle = screen.getByRole("button", { name: /actions/i })
    expect(toggle).toBeDisabled()
    // Clicking cannot open a menu.
    fireEvent.click(toggle)
    expect(document.querySelector(".dropdown-menu.show")).toBeNull()
    // The tooltip explains why on hover.
    fireEvent.mouseEnter(toggle.closest("span")!)
    expect(screen.getByRole("tooltip")).toHaveTextContent(/unavailable while the instance is rebooting/i)
  })

  it("renders nothing when the user has no available actions and nothing is in progress", () => {
    // No policy permission for any action → the menu is hidden entirely.
    policyState.allowed = false
    const { container } = renderMenu()
    expect(container).toBeEmptyDOMElement()
    policyState.allowed = true
  })

  it("separates action groups with dividers like the legacy menu", () => {
    // Running + unlocked shows three legacy groups in order:
    //   [Stop, Reboot, Pause, Suspend, Hard Reset] | [Lock] | [Terminate]
    // so two dividers sit between them — never before the first group.
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))

    const menu = document.querySelector(".dropdown-menu.show")!
    const items = Array.from(menu.children)
    // First child is an action, not a divider.
    expect(items[0].querySelector(".dropdown-item")?.textContent).toBe("Stop")
    expect(items[0].classList.contains("dropdown-divider")).toBe(false)

    const dividers = menu.querySelectorAll(".dropdown-divider")
    expect(dividers).toHaveLength(2)

    // The divider immediately precedes the first item of the next group.
    const labels = items.map((li) =>
      li.classList.contains("dropdown-divider") ? "---" : li.querySelector(".dropdown-item")?.textContent
    )
    expect(labels).toEqual(["Stop", "Reboot", "Pause", "Suspend", "Hard Reset", "---", "Lock", "---", "Terminate"])
  })

  it("disables the toggle and shows a spinner while an action is in flight", async () => {
    // A still-pending mutation must lock the menu: the toggle shows a spinner
    // and is disabled so a second action cannot be fired in the optimistic
    // window (e.g. an unlock that widens the menu before Nova settles).
    let release!: () => void
    action.mockImplementationOnce(() => new Promise<void>((res) => (release = () => res())))
    renderMenu({ status: { state: "stopped", transition: null, power_state: "Shut off" } })
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Start"))

    const toggle = screen.getByRole("button", { name: /actions/i })
    await waitFor(() => expect(toggle).toBeDisabled())
    expect(toggle.querySelector('[role="status"]')).not.toBeNull()
    expect(toggle.querySelector(".fa-cog")).toBeNull()

    release() // settle to avoid act() warnings
  })

  it("does not fire a second action while one is pending", async () => {
    let release!: () => void
    action.mockImplementationOnce(() => new Promise<void>((res) => (release = () => res())))
    renderMenu({ status: { state: "stopped", transition: null, power_state: "Shut off" } })
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Start"))

    const toggle = screen.getByRole("button", { name: /actions/i })
    await waitFor(() => expect(toggle).toBeDisabled())
    // Clicking the disabled toggle cannot reopen the menu -> no second action.
    fireEvent.click(toggle)
    expect(document.querySelector(".dropdown-menu.show")).toBeNull()
    expect(action).toHaveBeenCalledTimes(1)

    release()
  })

  it("colors only Terminate red in the dropdown, not the other destructive actions", () => {
    // Running + unlocked. Only Terminate carries the danger color in the menu;
    // Stop/Hard Reset stay the normal item color (their confirm dialog still
    // shows a red button — that is unchanged and covered elsewhere).
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))

    const danger = (label: string) =>
      screen.getByText(label).classList.contains("text-danger")
    expect(danger("Terminate")).toBe(true)
    expect(danger("Stop")).toBe(false)
    expect(danger("Hard Reset")).toBe(false)
  })

  it("delegates a confirm action to onConfirmRequest instead of lib/dialogs when provided", async () => {
    // In the detail modal the caller passes onConfirmRequest to render an inline
    // banner. The shared confirm dialog must NOT be opened; the delegate gets the
    // action and a run callback that fires the mutation only when invoked.
    const onConfirmRequest = vi.fn()
    renderMenu({}, onConfirmRequest)
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))

    expect(confirmMock).not.toHaveBeenCalled()
    expect(onConfirmRequest).toHaveBeenCalledTimes(1)
    const [passedAction, run] = onConfirmRequest.mock.calls[0]
    expect(passedAction.key).toBe("stop")
    // Menu closed; nothing fires until the delegate invokes run.
    expect(document.querySelector(".dropdown-menu.show")).toBeNull()
    expect(action).not.toHaveBeenCalled()

    run()
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "stop"))
  })

  it("fires a non-confirm action immediately even when onConfirmRequest is provided", async () => {
    // The delegate only governs confirm actions; Start (no confirm) still fires
    // directly without involving the delegate.
    const onConfirmRequest = vi.fn()
    renderMenu({ status: { state: "stopped", transition: null, power_state: "Shut off" } }, onConfirmRequest)
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Start"))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "start"))
    expect(onConfirmRequest).not.toHaveBeenCalled()
  })
})
