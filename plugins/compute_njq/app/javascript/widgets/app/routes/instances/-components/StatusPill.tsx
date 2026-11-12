import CoreStatusPill, { type StatusCategory } from "lib/components/StatusPill"
import { InfoTooltip } from "lib/components/InfoTooltip"
import { type InstanceStatus, isTransitioning } from "../../../types/instance"
import { humanize } from "./tabs/humanize"

// Maps the BFF's semantic state to the shared status-pill category that drives
// the colour tint. The backend emits the *meaning* (active/stopped/error/...);
// the colour choice is a presentation concern and therefore lives here, on the
// client. We reuse the core `.status-pill` component so compute_njq looks
// identical to the server-rendered (HAML) pages.
const CATEGORY_BY_STATE: Record<string, StatusCategory> = {
  active: "ok",
  stopped: "idle",
  error: "error",
  building: "busy",
  // Waiting for the user to confirm/revert a resize — flag it (warning tint),
  // but it is not an in-flight transition, so no spinner.
  verify_resize: "busy",
}

const LABEL_BY_STATE: Record<string, string> = {
  verify_resize: "Verify resize",
}

interface StatusPillProps {
  status: InstanceStatus
}

export function StatusPill({ status }: StatusPillProps) {
  // The pill shows the Nova vm_state (status) as text and colour — the
  // administrative state operators reason about (ACTIVE/SHUTOFF/ERROR/BUILD/
  // VERIFY_RESIZE/...), which `openstack server list` shows too.
  const category = CATEGORY_BY_STATE[status.state] ?? "idle"
  const label = LABEL_BY_STATE[status.state] ?? humanize(status.state)
  const transitioning = isTransitioning(status)

  // Tooltip: for an errored server show the fault message (the most useful
  // thing to surface); otherwise show the hypervisor power state (the less-
  // important value that doesn't fit in the pill text), falling back to the
  // humanised status.
  const tooltip =
    status.state === "error" && status.fault_message
      ? `Error: ${status.fault_message}`
      : status.power_state
        ? `Power state: ${status.power_state}`
        : `Status: ${humanize(status.state)}`

  // While a server is working (task_state set, or still building) render a
  // SINGLE capsule: a spinner on the left, the status label, and — if Nova
  // reports a task_state — the in-flight action appended in muted text. This
  // keeps the row height constant and reads as one coherent "in progress"
  // state instead of several stacked pills.
  if (transitioning) {
    return (
      <InfoTooltip content={tooltip} maxWidth="24rem">
        <span className={`status-pill status-pill-${category} d-inline-flex align-items-center gap-1`}>
          <span className="spinner spinner-on-pill" role="status" aria-label="in progress" />
          <span>{label}</span>
          {status.transition && <span className="status-pill-sub">· {humanize(status.transition)}</span>}
        </span>
      </InfoTooltip>
    )
  }

  return (
    <InfoTooltip content={tooltip} maxWidth="24rem">
      <CoreStatusPill status={status.state} category={category} label={LABEL_BY_STATE[status.state]} />
    </InfoTooltip>
  )
}
