import { describe, it, expect, vi } from "vitest"
vi.mock("lib/policy", () => ({ policy: { isAllowed: vi.fn(() => true) } }))
import { policy } from "lib/policy"
import { visibleActions } from "./instanceActions"
import { INSTANCE_ACTIONS } from "./instanceActions"
import type { Instance } from "../../../types/instance"

function inst(over: Partial<Instance> = {}): Instance {
  return {
    id: "s1",
    name: "x",
    locked: false,
    status: { state: "active", transition: null, power_state: "Running" },
    flavor: { id: null, name: null },
    image: { id: null, name: null },
    ips: [],
    created: null,
    ...over,
  } as Instance
}

describe("visibleActions", () => {
  it("offers stop/reboot/pause/suspend/hard_reset when Running", () => {
    const keys = visibleActions(inst(), {}).map((a) => a.key)
    expect(keys).toEqual(expect.arrayContaining(["stop", "reboot", "pause", "suspend", "hard_reset"]))
    expect(keys).not.toContain("start")
  })

  it("offers start only when parked", () => {
    const keys = visibleActions(
      inst({ status: { state: "stopped", transition: null, power_state: "Shut off" } }),
      {}
    ).map((a) => a.key)
    expect(keys).toContain("start")
    expect(keys).not.toContain("stop")
  })

  it("offers lock when unlocked and unlock when locked", () => {
    expect(visibleActions(inst({ locked: false }), {}).map((a) => a.key)).toContain("lock")
    expect(visibleActions(inst({ locked: true }), {}).map((a) => a.key)).toContain("unlock")
  })

  it("shows only unlock on a locked instance, hiding power and terminate actions", () => {
    // Legacy wraps every non-lock action in `- unless instance.locked?`, so a
    // locked VM exposes only Unlock. A running+locked instance must therefore
    // not offer stop/reboot/.../terminate.
    const keys = visibleActions(inst({ locked: true }), {}).map((a) => a.key)
    expect(keys).toEqual(["unlock"])
  })

  it("ignores transition state (the menu decides how to present a transition)", () => {
    // visibleActions reports the actions a user may perform regardless of a
    // running transition; InstanceActionsMenu shows the toggle disabled during
    // one rather than hiding it. So a rebooting (running) instance still yields
    // its normal running actions here.
    const actions = visibleActions(
      inst({ status: { state: "active", transition: "rebooting", power_state: "Running" } }),
      {}
    )
    expect(actions.map((a) => a.key)).toContain("stop")
  })

  it("respects the policy gate", () => {
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockReturnValue(false)
    expect(visibleActions(inst(), {})).toHaveLength(0)
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockReturnValue(true)
  })

  it("exposes edit-name, edit-tags and reset-status actions with modals", () => {
    const actions = visibleActions(inst(), {})
    const byKey = Object.fromEntries(actions.map((a) => [a.key, a]))
    expect(byKey.edit_name?.modal).toBe("editName")
    expect(byKey.edit_tags?.modal).toBe("editTags")
    expect(byKey.reset_status?.modal).toBe("resetStatus")
  })

  it("hides reset_status when only its policy denies", () => {
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockImplementation(
      (rule: string) => rule !== "compute_njq:instance_reset_status"
    )
    const keys = visibleActions(inst(), {}).map((a) => a.key)
    expect(keys).toContain("edit_name")
    expect(keys).not.toContain("reset_status")
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockReturnValue(true)
  })

  it("treats an unevaluable rule as not allowed instead of crashing the list", () => {
    // The real policy engine throws ("rule <name> not found.") when a rule is
    // missing from window.policyConfig — e.g. a stale server or a typo. A single
    // throw here would propagate up and blank the whole instances table via the
    // router error boundary. visibleActions must degrade: hide the action, keep
    // the rest of the list working.
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockImplementation((rule: string) => {
      if (rule === "compute_njq:instance_lock") throw "Policy Engine Error: rule compute_njq:instance_lock not found."
      return true
    })

    let keys: string[] = []
    expect(() => {
      keys = visibleActions(inst(), {}).map((a) => a.key)
    }).not.toThrow()
    expect(keys).not.toContain("lock")
    expect(keys).toContain("stop")
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockReturnValue(true)
  })

  it("offers Resize for active or stopped, not while verify_resize", () => {
    const keys = (state: string) =>
      visibleActions(inst({ status: { state, transition: null, power_state: "Running" } }), {}).map((a) => a.key)
    expect(keys("active")).toContain("resize")
    expect(keys("stopped")).toContain("resize")
    expect(keys("verify_resize")).not.toContain("resize")
  })

  it("offers Confirm/Revert Resize only while verify_resize", () => {
    const keys = (state: string) =>
      visibleActions(inst({ status: { state, transition: null, power_state: "Running" } }), {}).map((a) => a.key)
    expect(keys("verify_resize")).toEqual(expect.arrayContaining(["confirm_resize", "revert_resize"]))
    expect(keys("active")).not.toContain("confirm_resize")
    expect(keys("active")).not.toContain("revert_resize")
  })

  it("exposes the resize modal discriminator", () => {
    const resize = INSTANCE_ACTIONS.find((a) => a.key === "resize")
    expect(resize?.modal).toBe("resize")
  })

  it("registers a create snapshot action gated by the snapshot policy", () => {
    const action = INSTANCE_ACTIONS.find((a) => a.key === "create_image")
    expect(action).toBeDefined()
    expect(action?.policy).toBe("compute_njq:instance_snapshot")
    expect(action?.modal).toBe("snapshot")
  })

  it("hides resize, create snapshot and the edit actions in the detail surface", () => {
    // The detail modal shows only VM lifecycle operations; resize, snapshot and
    // the edit (name/tags) actions are configuration/form actions and belong to
    // the list row only.
    const keys = visibleActions(inst(), {}, "detail").map((a) => a.key)
    expect(keys).not.toContain("resize")
    expect(keys).not.toContain("create_image")
    expect(keys).not.toContain("edit_name")
    expect(keys).not.toContain("edit_tags")
    // Lifecycle actions still show in detail.
    expect(keys).toContain("stop")
  })

  it("keeps resize, create snapshot and the edit actions in the list surface (and by default)", () => {
    expect(visibleActions(inst(), {}, "list").map((a) => a.key)).toEqual(
      expect.arrayContaining(["resize", "create_image", "edit_name", "edit_tags"])
    )
    expect(visibleActions(inst(), {}).map((a) => a.key)).toEqual(
      expect.arrayContaining(["resize", "create_image", "edit_name", "edit_tags"])
    )
  })
})
