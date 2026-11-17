import { describe, it, expect, vi } from "vitest"
vi.mock("lib/policy", () => ({ policy: { isAllowed: vi.fn(() => true) } }))
import { policy } from "lib/policy"
import { visibleActions } from "./instanceActions"
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

  it("hides everything while transitioning", () => {
    expect(
      visibleActions(inst({ status: { state: "active", transition: "rebooting", power_state: "Running" } }), {})
    ).toHaveLength(0)
  })

  it("respects the policy gate", () => {
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockReturnValue(false)
    expect(visibleActions(inst(), {})).toHaveLength(0)
    ;(policy.isAllowed as ReturnType<typeof vi.fn>).mockReturnValue(true)
  })
})
