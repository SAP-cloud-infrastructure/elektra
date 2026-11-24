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
    | "attach_floating_ip"
    | "detach_floating_ip"
    | "attach_interface"
    | "detach_interface"
    | "edit_security_groups"
    | "web_console"
  label: string
  policy: string
  // Legacy _item_actions.html.haml splits the dropdown into divider-separated
  // groups. visibleActions keeps that order and inserts a divider between groups
  // (never before the first). Edit (name/tags), power lifecycle, the floating-IP
  // operations, the interface operations, edit security groups, lock/unlock,
  // then terminate (with reset_status alongside it). Floating-IP, interface and
  // security groups each get their own section so they read as distinct network
  // operations, not power lifecycle.
  group: "console" | "edit" | "power" | "floating_ip" | "interface" | "security_group" | "lock" | "terminate"
  isAvailable: (i: Instance) => boolean
  // Confirmation shown before the action runs: a short title (the action as a
  // question), a consequence statement as the body, and the verb for the OK
  // button. This follows the "state the consequence + verb button" pattern
  // rather than a rhetorical "Are you sure?". The message is a function of the
  // instance name so the dialog names the exact VM — a guard against acting on
  // the wrong row. Terminate has no confirm here: it uses a dedicated
  // type-to-confirm modal (see modal: "terminate").
  confirm?: { title: string; message: (name: string) => string; ok: string }
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
  // Status, Terminate); actions without it run (optionally after a confirm)
  // directly.
  modal?:
    | "editName"
    | "editTags"
    | "resetStatus"
    | "resize"
    | "snapshot"
    | "attachFloatingIp"
    | "detachFloatingIp"
    | "attachInterface"
    | "detachInterface"
    | "editSecurityGroups"
    | "terminate"
  // Actions that only make sense from the list row, not the detail modal, which
  // shows only VM lifecycle operations. Resize, Create Snapshot, the edit
  // (name/tags) actions, the floating-IP actions and Terminate are
  // configuration/form actions (and Terminate would close the detail modal it
  // lives in), so they are hidden in the detail surface.
  listOnly?: boolean
  // Opens the standalone full-page web console (a dashboard-origin HAML page) in
  // a new tab instead of running a mutation or modal. The menu renders it as a
  // link; the href is built by the caller (it needs the plugin basepath).
  externalConsole?: boolean
}

const PARKED = ["Paused", "Suspended", "Shut off", "Shut down"]
const isRunning = (i: Instance) => i.status.power_state === "Running"
const isParked = (i: Instance) => PARKED.includes(i.status.power_state ?? "")
const hasFloatingIp = (i: Instance) => (i.ips ?? []).some((ip) => ip.type === "floating")
const hasFixedIp = (i: Instance) => (i.ips ?? []).some((ip) => ip.type === "fixed")

// Legacy wording from Compute::Server#target_state_for_action / confirm texts.
export const INSTANCE_ACTIONS: InstanceAction[] = [
  {
    key: "web_console",
    label: "Web Console",
    policy: "compute_njq:instance_console",
    group: "console",
    // Only meaningful for a running guest; the full-page console opens in a tab.
    isAvailable: isRunning,
    externalConsole: true,
  },
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
      message: (name) => `This shuts down the guest OS and powers off “${name}”. Running processes will be stopped.`,
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
      message: (name) =>
        `This gracefully restarts the guest OS of “${name}”. The instance will be briefly unavailable.`,
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
      message: (name) => `This freezes “${name}” in memory. It stays on the hypervisor and can be resumed later.`,
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
      message: (name) => `This writes the memory of “${name}” to disk and powers it off. It can be resumed later.`,
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
      message: (name) => `This forcibly power-cycles “${name}” without a clean shutdown. Unsaved data may be lost.`,
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
    key: "attach_floating_ip",
    label: "Attach Floating IP",
    policy: "compute_njq:instance_attach_floating_ip",
    group: "floating_ip",
    isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
    modal: "attachFloatingIp",
    listOnly: true,
  },
  {
    key: "detach_floating_ip",
    label: "Detach Floating IP",
    policy: "compute_njq:instance_detach_floating_ip",
    group: "floating_ip",
    isAvailable: hasFloatingIp,
    modal: "detachFloatingIp",
    listOnly: true,
  },
  {
    key: "attach_interface",
    label: "Attach Interface",
    policy: "compute_njq:instance_attach_interface",
    group: "interface",
    isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
    modal: "attachInterface",
    listOnly: true,
  },
  {
    key: "detach_interface",
    label: "Detach Interface",
    policy: "compute_njq:instance_detach_interface",
    group: "interface",
    isAvailable: (i) => ["active", "stopped"].includes(i.status.state) && hasFixedIp(i),
    modal: "detachInterface",
    listOnly: true,
  },
  {
    key: "edit_security_groups",
    label: "Edit Security Groups",
    policy: "compute_njq:instance_edit_securitygroups",
    group: "security_group",
    isAvailable: () => true,
    modal: "editSecurityGroups",
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
      message: (name) =>
        `This keeps the new size and finalizes the resize of “${name}”. The instance stays on the new flavor.`,
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
      message: (name) => `This discards the new size and restores “${name}” to its previous flavor.`,
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
      message: (name) =>
        `This prevents lifecycle actions (stop, reboot, terminate, …) on “${name}” until it is unlocked.`,
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
      message: (name) => `This re-enables lifecycle actions on “${name}”.`,
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
    // Terminate is irreversible, so instead of a plain confirm it opens a
    // type-to-confirm modal: the user must type the instance name to enable the
    // button. See TerminateModal. list-only: the detail modal shows only VM
    // lifecycle operations, and terminating would close the very modal you are
    // in, so it lives on the list row only.
    modal: "terminate",
    listOnly: true,
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
