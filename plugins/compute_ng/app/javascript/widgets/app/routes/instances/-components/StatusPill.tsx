import { Badge, Stack } from "@cloudoperators/juno-ui-components"
import type { InstanceStatus } from "../../../types/instance"

// Maps the BFF's semantic state to a Juno Badge variant. The backend emits the
// *meaning* (active/stopped/error/...); the colour choice is a presentation
// concern and therefore lives here, on the client.
const VARIANT_BY_STATE: Record<string, "success" | "danger" | "warning" | "info"> = {
  active: "success",
  stopped: "info",
  error: "danger",
  building: "warning",
}

interface StatusPillProps {
  status: InstanceStatus
}

export function StatusPill({ status }: StatusPillProps) {
  const variant = VARIANT_BY_STATE[status.state] ?? "info"

  return (
    <Stack gap="1" alignment="center">
      <Badge variant={variant}>{status.state}</Badge>
      {status.transition && <Badge variant="warning">{status.transition}</Badge>}
    </Stack>
  )
}
