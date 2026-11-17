import { policy } from "lib/policy"
import { Instance, isTransitioning } from "../../../types/instance"

export interface InstanceAction {
  key: "start" | "stop" | "reboot" | "hard_reset" | "pause" | "suspend" | "lock" | "unlock" | "terminate"
  label: string
  policy: string
  isAvailable: (i: Instance) => boolean
  confirm?: { message: string; ok: string }
  destructive?: boolean
  optimisticTransition?: string
}

const PARKED = ["Paused", "Suspended", "Shut off", "Shut down"]
const isRunning = (i: Instance) => i.status.power_state === "Running"
const isParked = (i: Instance) => PARKED.includes(i.status.power_state ?? "")

// Legacy wording from Compute::Server#target_state_for_action / confirm texts.
export const INSTANCE_ACTIONS: InstanceAction[] = [
  {
    key: "start",
    label: "Start",
    policy: "compute_njq:instance_update",
    isAvailable: isParked,
    optimisticTransition: "powering-on",
  },
  {
    key: "stop",
    label: "Stop",
    policy: "compute_njq:instance_update",
    isAvailable: isRunning,
    optimisticTransition: "powering-off",
    destructive: true,
    confirm: { message: "Are you sure you want to stop this instance?", ok: "Yes, stop it" },
  },
  {
    key: "reboot",
    label: "Reboot",
    policy: "compute_njq:instance_update",
    isAvailable: isRunning,
    optimisticTransition: "rebooting",
    confirm: { message: "Are you sure you want to reboot this instance?", ok: "Yes, reboot it" },
  },
  {
    key: "pause",
    label: "Pause",
    policy: "compute_njq:instance_update",
    isAvailable: isRunning,
    optimisticTransition: "pausing",
    confirm: { message: "Are you sure you want to pause this instance?", ok: "Yes, pause it" },
  },
  {
    key: "suspend",
    label: "Suspend",
    policy: "compute_njq:instance_update",
    isAvailable: isRunning,
    optimisticTransition: "suspending",
    confirm: { message: "Are you sure you want to suspend this instance?", ok: "Yes, suspend it" },
  },
  {
    key: "hard_reset",
    label: "Hard Reset",
    policy: "compute_njq:instance_hard_reset",
    isAvailable: isRunning,
    optimisticTransition: "rebooting",
    destructive: true,
    confirm: { message: "Are you sure you want to hard reset this instance?", ok: "Yes, hard reset it" },
  },
  {
    key: "lock",
    label: "Lock",
    policy: "compute_njq:instance_lock",
    isAvailable: (i) => !i.locked,
    confirm: { message: "Are you sure you want to lock this instance?", ok: "Yes, lock it" },
  },
  {
    key: "unlock",
    label: "Unlock",
    policy: "compute_njq:instance_unlock",
    isAvailable: (i) => i.locked,
    confirm: { message: "Are you sure you want to unlock this instance?", ok: "Yes, unlock it" },
  },
  {
    key: "terminate",
    label: "Terminate",
    policy: "compute_njq:instance_delete",
    isAvailable: () => true,
    optimisticTransition: "deleting",
    destructive: true,
    confirm: { message: "Are you sure you want to terminate this instance?", ok: "Yes, terminate it" },
  },
]

// A rule the policy engine can't evaluate — missing from window.policyConfig
// (stale server, typo) — makes policy.isAllowed throw rather than return false.
// Treat that as "not allowed" so one bad rule hides a single action instead of
// crashing the whole table through the router error boundary.
function isAllowed(rule: string, scope: Record<string, unknown>): boolean {
  try {
    return policy.isAllowed(rule, { target: scope })
  } catch {
    return false
  }
}

export function visibleActions(instance: Instance, scope: Record<string, unknown>): InstanceAction[] {
  if (isTransitioning(instance.status)) return []
  return INSTANCE_ACTIONS.filter((a) => a.isAvailable(instance) && isAllowed(a.policy, scope))
}
