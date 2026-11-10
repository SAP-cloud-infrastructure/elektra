import CoreStatusPill, { type StatusCategory } from "lib/components/StatusPill"
import type { InstanceStatus } from "../../../types/instance"

// Maps the BFF's semantic state to the shared status-pill category that drives
// the colour tint. The backend emits the *meaning* (active/stopped/error/...);
// the colour choice is a presentation concern and therefore lives here, on the
// client. We reuse the core `.status-pill` component so compute_ng looks
// identical to the server-rendered (HAML) pages.
const CATEGORY_BY_STATE: Record<string, StatusCategory> = {
  active: "ok",
  stopped: "idle",
  error: "error",
  building: "busy",
}

interface StatusPillProps {
  status: InstanceStatus
}

export function StatusPill({ status }: StatusPillProps) {
  const category = CATEGORY_BY_STATE[status.state] ?? "idle"

  return (
    <span className="d-inline-flex flex-wrap align-items-center gap-1">
      <CoreStatusPill status={status.state} category={category} />
      {status.transition && <CoreStatusPill status={status.transition} category="busy" variant="outline" />}
    </span>
  )
}
