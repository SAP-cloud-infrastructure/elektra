import { useState } from "react"
import { Stack, Button } from "@cloudoperators/juno-ui-components"
import type { InstanceIps } from "../../../types/instance"

const MAX_VISIBLE = 2

interface IpListProps {
  ips: InstanceIps
}

// Renders fixed + floating IPs with a "+N more" toggle. The collapsing logic is
// pure presentation and intentionally lives in the component, not the BFF.
export function IpList({ ips }: IpListProps) {
  const [expanded, setExpanded] = useState(false)

  const all = [
    ...ips.floating.map((ip) => ({ ip, kind: "floating" as const })),
    ...ips.fixed.map((ip) => ({ ip, kind: "fixed" as const })),
  ]

  if (all.length === 0) return <span className="tw-text-theme-light">—</span>

  const visible = expanded ? all : all.slice(0, MAX_VISIBLE)
  const hidden = all.length - visible.length

  return (
    <Stack direction="vertical" gap="0.5">
      {visible.map(({ ip, kind }) => (
        <span key={`${kind}-${ip}`}>
          {ip}
          {kind === "floating" && <span className="tw-text-theme-light tw-ml-1">(floating)</span>}
        </span>
      ))}
      {hidden > 0 && !expanded && (
        <Button size="small" variant="subdued" onClick={() => setExpanded(true)}>
          +{hidden} more
        </Button>
      )}
      {expanded && all.length > MAX_VISIBLE && (
        <Button size="small" variant="subdued" onClick={() => setExpanded(false)}>
          Show less
        </Button>
      )}
    </Stack>
  )
}
