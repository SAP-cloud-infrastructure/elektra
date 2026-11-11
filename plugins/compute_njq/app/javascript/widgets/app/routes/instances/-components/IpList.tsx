import { useState } from "react"
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

  if (all.length === 0) return <span className="text-muted">—</span>

  const visible = expanded ? all : all.slice(0, MAX_VISIBLE)
  const hidden = all.length - visible.length

  return (
    <div className="d-flex flex-column gap-1">
      {visible.map(({ ip, kind }) => (
        <span key={`${kind}-${ip}`}>
          {ip}
          {kind === "floating" && <span className="text-muted ms-1">(floating)</span>}
        </span>
      ))}
      {hidden > 0 && !expanded && (
        <button type="button" className="btn btn-link btn-sm p-0 text-start" onClick={() => setExpanded(true)}>
          +{hidden} more
        </button>
      )}
      {expanded && all.length > MAX_VISIBLE && (
        <button type="button" className="btn btn-link btn-sm p-0 text-start" onClick={() => setExpanded(false)}>
          Show less
        </button>
      )}
    </div>
  )
}
