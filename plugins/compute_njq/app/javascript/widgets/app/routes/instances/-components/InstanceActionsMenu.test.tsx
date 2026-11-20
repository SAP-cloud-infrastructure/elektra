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

// The menu mounts ResizeModal on the "resize" action, which queries the flavor
// catalog and the instance detail on open. Stub both so the shared apiClient mock
// needs no extra methods.
vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: [], isLoading: false }),
}))
vi.mock("../../../hooks/useInstanceQueries", () => ({
  useInstanceDetailQuery: () => ({ data: { flavor: { id: "f1", name: "m1.small" } }, isLoading: false }),
}))
// Attach Floating IP modal fetches free FIPs + external networks on open.
vi.mock("../../../hooks/useFloatingIpOptionsQuery", () => ({
  useFloatingIpOptionsQuery: () => ({
    data: { available_floating_ips: [{ id: "f1", floating_ip_address: "1.1.1.1" }], external_networks: [] },
    isLoading: false,
  }),
}))
// Attach Interface modal fetches available networks, subnets, and security groups on open.
vi.mock("../../../hooks/useInterfaceOptionsQuery", () => ({
  useInterfaceOptionsQuery: () => ({ data: { networks: [], subnets: [], security_groups: [] }, isLoading: false }),
}))
// Detach Interface modal fetches already-attached interfaces on open.
vi.mock("../../../hooks/useAttachedInterfacesQuery", () => ({
  useAttachedInterfacesQuery: () => ({ data: { attached_interfaces: [] }, isLoading: false }),
}))

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

function renderDetailMenu(over: Partial<Instance> = {}) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <InstanceActionsMenu
        instance={{ ...instance, ...over } as Instance}
        scope={{}}
        apiClient={{ instances: { action, terminate: vi.fn() } } as never}
        surface="detail"
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

  it("keeps an open modal mounted when the row starts transitioning", () => {
    // Regression: attaching/detaching a floating IP (and snapshot) optimistically
    // sets status.transition on the same row whose menu hosts the modal. The
    // "transitioning" early-return must NOT unmount the open modal — doing so
    // cancels the modal's own mutation (so it never closes on success) and then
    // remounts a fresh, empty modal when the transition settles ("reappears
    // ungefragt"). The modal stays mounted regardless of the row's transition.
    const qc = new QueryClient()
    const api = { instances: { action, terminate: vi.fn(), attachFloatingIp: vi.fn() } } as never
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <InstanceActionsMenu instance={instance} scope={{}} apiClient={api} />
      </QueryClientProvider>
    )
    // Open the Attach Floating IP modal.
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Attach Floating IP"))
    expect(screen.getByText("Attach Floating IP", { selector: ".modal-title" })).toBeInTheDocument()

    // The optimistic patch arrives via props: the row is now transitioning.
    rerender(
      <QueryClientProvider client={qc}>
        <InstanceActionsMenu
          instance={{ ...instance, status: { ...instance.status, transition: "associating_floating_ip" } } as Instance}
          scope={{}}
          apiClient={api}
        />
      </QueryClientProvider>
    )

    // The modal must still be on screen — not unmounted by the transitioning
    // early-return.
    expect(screen.getByText("Attach Floating IP", { selector: ".modal-title" })).toBeInTheDocument()
  })

  it("closes the attach modal on success even after the row starts transitioning", async () => {
    // Stronger regression for the reported bug: a successful attach must close
    // the modal. The optimistic mutation sets status.transition on this very
    // row, which re-renders the menu into its transitioning shape. If that
    // re-render unmounts/remounts the modal, the modal's own useMutation (whose
    // per-call onSuccess calls onClose) is destroyed before it can resolve — so
    // the modal never closes. The modal must survive the transition at a stable
    // tree position so onSuccess → onClose still fires.
    const qc = new QueryClient()
    let resolveAttach!: () => void
    const attachFloatingIp = vi.fn(() => new Promise<void>((res) => (resolveAttach = () => res())))
    const api = { instances: { action, terminate: vi.fn(), attachFloatingIp } } as never
    // One fixed IP so the modal auto-selects the target and the Attach button
    // is enabled once a floating IP is chosen.
    const withFixed = { ...instance, ips: [{ addr: "10.0.0.5", type: "fixed" }] } as Instance

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <InstanceActionsMenu instance={withFixed} scope={{}} apiClient={api} />
      </QueryClientProvider>
    )

    // Open the modal and pick an existing floating IP (mocked option "f1").
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Attach Floating IP"))
    fireEvent.change(screen.getByLabelText(/floating ip/i), { target: { value: "f1" } })
    // Submit — fires the mutation (onMutate patches the instances cache).
    fireEvent.click(screen.getByRole("button", { name: /^attach$/i }))
    await waitFor(() => expect(attachFloatingIp).toHaveBeenCalled())

    // Simulate the optimistic transition arriving via props (the real cache
    // patch would re-render the list with this status).
    rerender(
      <QueryClientProvider client={qc}>
        <InstanceActionsMenu
          instance={{ ...withFixed, status: { ...withFixed.status, transition: "associating_floating_ip" } } as Instance}
          scope={{}}
          apiClient={api}
        />
      </QueryClientProvider>
    )

    // The mutation resolves — onSuccess must run onClose, unmounting the modal.
    resolveAttach()
    await waitFor(() =>
      expect(screen.queryByText("Attach Floating IP", { selector: ".modal-title" })).not.toBeInTheDocument()
    )
  })

  it("renders nothing when the user has no available actions and nothing is in progress", () => {
    // No policy permission for any action → the menu is hidden entirely.
    policyState.allowed = false
    const { container } = renderMenu()
    expect(container).toBeEmptyDOMElement()
    policyState.allowed = true
  })

  it("separates action groups with dividers like the legacy menu", () => {
    // Running + unlocked shows four groups in order:
    //   [Edit Name, Edit Tags] | [Stop, Reboot, Pause, Suspend, Hard Reset, Resize, Create Snapshot, Attach Floating IP, Attach Interface]
    //   | [Lock] | [Reset Status, Terminate]
    // so three dividers sit between them — never before the first group.
    // (Detach Floating IP and Detach Interface only appear when the instance has a floating IP or fixed IP.)
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))

    const menu = document.querySelector(".dropdown-menu.show")!
    const items = Array.from(menu.children)
    // First child is an action, not a divider.
    expect(items[0].querySelector(".dropdown-item")?.textContent).toBe("Edit Name")
    expect(items[0].classList.contains("dropdown-divider")).toBe(false)

    const dividers = menu.querySelectorAll(".dropdown-divider")
    expect(dividers).toHaveLength(3)

    // The divider immediately precedes the first item of the next group.
    const labels = items.map((li) =>
      li.classList.contains("dropdown-divider") ? "---" : li.querySelector(".dropdown-item")?.textContent
    )
    expect(labels).toEqual([
      "Edit Name",
      "Edit Tags",
      "---",
      "Stop",
      "Reboot",
      "Pause",
      "Suspend",
      "Hard Reset",
      "Resize",
      "Create Snapshot",
      "Attach Floating IP",
      "Attach Interface",
      "---",
      "Lock",
      "---",
      "Reset Status",
      "Terminate",
    ])
  })

  it("omits list-only actions (Resize, Create Snapshot, Edit Name/Tags) when surface is detail", () => {
    // The detail modal shows only VM lifecycle operations; resize, snapshot and
    // the edit actions are list-only. Stop still shows in the detail surface.
    renderDetailMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    expect(screen.queryByText("Resize")).not.toBeInTheDocument()
    expect(screen.queryByText("Create Snapshot")).not.toBeInTheDocument()
    expect(screen.queryByText("Edit Name")).not.toBeInTheDocument()
    expect(screen.queryByText("Edit Tags")).not.toBeInTheDocument()
    expect(screen.getByText("Stop")).toBeInTheDocument()
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

  it("opens the Edit Name modal from the menu instead of firing a mutation", () => {
    // Modal actions (Edit Name/Tags, Reset Status) don't fire the action
    // mutation; they open their form. Clicking Edit Name closes the menu and
    // renders the modal dialog; no confirm dialog, no action call.
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Edit Name"))

    expect(document.querySelector(".dropdown-menu.show")).toBeNull()
    expect(confirmMock).not.toHaveBeenCalled()
    expect(action).not.toHaveBeenCalled()
    expect(screen.getByText("Edit Name", { selector: ".modal-title" })).toBeInTheDocument()
  })

  it("opens the Resize modal from the menu instead of firing a mutation", () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Resize"))

    expect(document.querySelector(".dropdown-menu.show")).toBeNull()
    expect(confirmMock).not.toHaveBeenCalled()
    expect(action).not.toHaveBeenCalled()
    expect(screen.getByText("Resize Instance", { selector: ".modal-title" })).toBeInTheDocument()
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

  it("opens the Attach Interface modal from the menu", () => {
    renderMenu()
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Attach Interface"))
    expect(screen.getByText("Attach Interface", { selector: ".modal-title" })).toBeInTheDocument()
  })

  it("opens the Detach Interface modal when the instance has a fixed IP", () => {
    renderMenu({ ips: [{ addr: "10.0.0.9", type: "fixed" }] })
    fireEvent.click(screen.getByRole("button", { name: /actions/i }))
    fireEvent.click(screen.getByText("Detach Interface"))
    expect(screen.getByText("Detach Interface", { selector: ".modal-title" })).toBeInTheDocument()
  })
})
