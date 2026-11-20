import { policy } from "lib/policy"
import { Instance } from "../../../types/instance"

export interface InstanceAction {
  key:
    | "edit_name"
    | "edit_tags"
    | "resize"
    | "confirm_resize"
    | "revert_resize"
    | "create_image"
    | "start"
    | "stop"
    | "reboot"
    | "hard_reset"
    | "pause"
    | "suspend"
    | "lock"
    | "unlock"
    | "reset_status"
    | "terminate"
  label: string
  policy: string
  // Legacy _item_actions.html.haml splits the dropdown into divider-separated
  // groups. visibleActions keeps that order and inserts a divider between groups
  // (never before the first). Edit (name/tags), power lifecycle, lock/unlock,
  // then terminate (with reset_status alongside it).
  group: "edit" | "power" | "lock" | "terminate"
  isAvailable: (i: Instance) => boolean
  // Confirmation shown before the action runs: a short title (the action as a
  // question), a consequence statement as the body, and the verb for the OK
  // button. This follows the "state the consequence + verb button" pattern
  // rather than a rhetorical "Are you sure?".
  confirm?: { title: string; message: string; ok: string }
  // Marks an action as dangerous: its confirm dialog uses a red (btn-danger)
  // button. This does NOT color the dropdown entry — see dangerLabel for that.
  destructive?: boolean
  // Colors the dropdown entry red (text-danger). Reserved for the single most
  // destructive action (terminate); other destructive actions keep the normal
  // item color in the menu but still get a red confirm button.
  dangerLabel?: boolean
  optimisticTransition?: string
  // Form-based actions open a modal instead of firing immediately. The menu maps
  // this discriminator to the matching modal component (Edit Name/Tags, Reset
  // Status); actions without it run (optionally after a confirm) directly.
  modal?: "editName" | "editTags" | "resetStatus" | "resize" | "snapshot"
  // Actions that only make sense from the list row, not the detail modal, which
  // shows only VM lifecycle operations. Resize, Create Snapshot and the edit
  // (name/tags) actions are configuration/form actions, so they are hidden in
  // the detail surface.
  listOnly?: boolean
}

const PARKED = ["Paused", "Suspended", "Shut off", "Shut down"]
const isRunning = (i: Instance) => i.status.power_state === "Running"
const isParked = (i: Instance) => PARKED.includes(i.status.power_state ?? "")

// Legacy wording from Compute::Server#target_state_for_action / confirm texts.
export const INSTANCE_ACTIONS: InstanceAction[] = [
  {
    key: "edit_name",
    label: "Edit Name",
    policy: "compute_njq:instance_update",
    group: "edit",
    isAvailable: () => true,
    modal: "editName",
    listOnly: true,
  },
  {
    key: "edit_tags",
    label: "Edit Tags",
    policy: "compute_njq:instance_tags",
    group: "edit",
    isAvailable: () => true,
    modal: "editTags",
    listOnly: true,
  },
  {
    key: "start",
    label: "Start",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: isParked,
    optimisticTransition: "powering-on",
  },
  {
    key: "stop",
    label: "Stop",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: isRunning,
    optimisticTransition: "powering-off",
    destructive: true,
    confirm: {
      title: "Stop instance?",
      message: "This shuts down the guest OS and powers off the instance. Running processes will be stopped.",
      ok: "Stop instance",
    },
  },
  {
    key: "reboot",
    label: "Reboot",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: isRunning,
    optimisticTransition: "rebooting",
    confirm: {
      title: "Reboot instance?",
      message: "This gracefully restarts the guest OS. The instance will be briefly unavailable.",
      ok: "Reboot instance",
    },
  },
  {
    key: "pause",
    label: "Pause",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: isRunning,
    optimisticTransition: "pausing",
    confirm: {
      title: "Pause instance?",
      message: "This freezes the instance in memory. It stays on the hypervisor and can be resumed later.",
      ok: "Pause instance",
    },
  },
  {
    key: "suspend",
    label: "Suspend",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: isRunning,
    optimisticTransition: "suspending",
    confirm: {
      title: "Suspend instance?",
      message: "This writes the instance's memory to disk and powers it off. It can be resumed later.",
      ok: "Suspend instance",
    },
  },
  {
    key: "hard_reset",
    label: "Hard Reset",
    policy: "compute_njq:instance_hard_reset",
    group: "power",
    isAvailable: isRunning,
    optimisticTransition: "rebooting",
    destructive: true,
    confirm: {
      title: "Hard reset instance?",
      message: "This forcibly power-cycles the instance without a clean shutdown. Unsaved data may be lost.",
      ok: "Hard reset instance",
    },
  },
  {
    key: "resize",
    label: "Resize",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
    modal: "resize",
    listOnly: true,
  },
  {
    key: "create_image",
    label: "Create Snapshot",
    policy: "compute_njq:instance_snapshot",
    group: "power",
    isAvailable: () => true,
    modal: "snapshot",
    listOnly: true,
  },
  {
    key: "confirm_resize",
    label: "Confirm Resize",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: (i) => i.status.state === "verify_resize",
    optimisticTransition: "resize_confirming",
    confirm: {
      title: "Confirm resize?",
      message: "This keeps the new size and finalizes the resize. The instance stays on the new flavor.",
      ok: "Confirm resize",
    },
  },
  {
    key: "revert_resize",
    label: "Revert Resize",
    policy: "compute_njq:instance_update",
    group: "power",
    isAvailable: (i) => i.status.state === "verify_resize",
    optimisticTransition: "resize_reverting",
    confirm: {
      title: "Revert resize?",
      message: "This discards the new size and restores the instance to its previous flavor.",
      ok: "Revert resize",
    },
  },
  {
    key: "lock",
    label: "Lock",
    policy: "compute_njq:instance_lock",
    group: "lock",
    isAvailable: (i) => !i.locked,
    confirm: {
      title: "Lock instance?",
      message: "This prevents lifecycle actions (stop, reboot, terminate, …) until the instance is unlocked.",
      ok: "Lock instance",
    },
  },
  {
    key: "unlock",
    label: "Unlock",
    policy: "compute_njq:instance_unlock",
    group: "lock",
    isAvailable: (i) => i.locked,
    confirm: {
      title: "Unlock instance?",
      message: "This re-enables lifecycle actions on the instance.",
      ok: "Unlock instance",
    },
  },
  {
    key: "reset_status",
    label: "Reset Status",
    policy: "compute_njq:instance_reset_status",
    group: "terminate",
    isAvailable: () => true,
    modal: "resetStatus",
  },
  {
    key: "terminate",
    label: "Terminate",
    policy: "compute_njq:instance_delete",
    group: "terminate",
    isAvailable: () => true,
    optimisticTransition: "deleting",
    destructive: true,
    dangerLabel: true,
    confirm: {
      title: "Terminate instance?",
      message: "This permanently deletes the instance. Attached non-persistent disks are destroyed. This cannot be undone.",
      ok: "Terminate instance",
    },
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

// The actions a user may perform on an instance, independent of whether it is
// currently transitioning. Filters by availability for the current power state,
// the lock rule (a locked instance exposes only Unlock), and policy. The caller
// decides how to present a transitioning instance (the menu shows the toggle
// disabled rather than hiding it, so the row layout stays stable). The `surface`
// drops list-only actions (Resize, Create Snapshot, Edit Name/Tags) from the
// detail modal, which shows only VM lifecycle operations.
export function visibleActions(
  instance: Instance,
  scope: Record<string, unknown>,
  surface: "list" | "detail" = "list"
): InstanceAction[] {
  // Legacy wraps every non-lock action in `- unless instance.locked?`
  // (_item_actions.html.haml), so a locked instance exposes only Unlock.
  return INSTANCE_ACTIONS.filter(
    (a) =>
      a.isAvailable(instance) &&
      (!instance.locked || a.key === "unlock") &&
      isAllowed(a.policy, scope) &&
      !(surface === "detail" && a.listOnly)
  )
}
