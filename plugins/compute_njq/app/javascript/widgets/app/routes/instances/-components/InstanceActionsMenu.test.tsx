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

  it("keeps the menu closed until the toggle is clicked", () => {
    renderMenu()
    const toggle = screen.getByRole("button", { name: /actions/i })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(document.querySelector(".dropdown-menu.show")).toBeNull()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(document.querySelector(".dropdown-menu.show")).not.toBeNull()
  })

  it("shows an inline confirm for a confirm action and fires on confirm", async () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))
    // The confirm is inline in the still-open panel, not a separate modal.
    expect(document.querySelector(".dropdown-menu.show")).not.toBeNull()
    expect(screen.getByText("Yes, stop it")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Yes, stop it"))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "stop"))
  })

  it("does not fire a confirm action until confirmed and can be cancelled", () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))
    expect(action).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText("Cancel"))
    // Back to the action list, nothing fired.
    expect(action).not.toHaveBeenCalled()
    expect(screen.getByText("Stop")).toBeInTheDocument()
  })

  it("renders the confirm inline without a second modal backdrop", () => {
    // Regression guard for the detail-view case: the menu lives inside a modal
    // there, so the confirm must not open its own portal Modal (which paints a
    // second .modal-backdrop and makes the confirm unusable).
    renderMenu()
    const before = document.querySelectorAll(".modal-backdrop").length
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Stop"))
    expect(screen.getByText("Yes, stop it")).toBeInTheDocument()
    expect(document.querySelectorAll(".modal-backdrop").length).toBe(before)
  })

  it("fires a non-confirm action immediately without a dialog", async () => {
    // Start (parked-only, no confirm) must fire the mutation on click with no
    // confirmation dialog in between.
    renderMenu({ status: { state: "stopped", transition: null, power_state: "Shut off" } })
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Start"))
    await waitFor(() => expect(action).toHaveBeenCalledWith("s1", "start"))
  })

  it("renders nothing when there are no visible actions (transitioning)", () => {
    const { container } = renderMenu({
      status: { state: "active", transition: "rebooting", power_state: "Running" },
    })
    expect(container).toBeEmptyDOMElement()
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
})
