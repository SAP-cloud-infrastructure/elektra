import { Link } from "@tanstack/react-router"
import { InfoTooltip } from "lib/components/InfoTooltip"
import type { InstanceIps } from "../../../types/instance"

const FLOATING_HELP =
  "Floating IP — an external, assignable address through which this server is reachable from outside the project network. Click to see all IPs."

interface IpListProps {
  ips: InstanceIps
  instanceId: string
}

// Compact IP cell: shows a single representative fixed IP, and — when the
// server has a floating IP — a clickable "Floating" badge that opens the detail
// view (where the full fixed<->floating mapping lives). A "+N more" link opens
// the same detail view. All IP interactions lead to the detail IP tab, keeping
// the list row calm.
export function IpList({ ips, instanceId }: IpListProps) {
  if (!ips || ips.length === 0) return <span className="text-muted">—</span>

  const hasFloating = ips.some((ip) => ip.type === "floating")
  const fixed = ips.filter((ip) => ip.type === "fixed")
  // The primary address shown in the list: first fixed IP, or the first IP of
  // any kind if the server has no fixed IP at all.
  const primary = (fixed[0] ?? ips[0]).addr
  // "+N more" counts only the *additional fixed* IPs beyond the primary one —
  // floating IPs are surfaced separately via the Floating badge.
  const more = Math.max(fixed.length - 1, 0)

  return (
    <div className="instance-ips">
      <div className="instance-ip-primary">
        <span className="instance-ip-addr">{primary}</span>
        {hasFloating && (
          <InfoTooltip content={FLOATING_HELP} maxWidth="20rem">
            <Link
              to="/instances/$id"
              params={{ id: instanceId }}
              search={{ tab: "IP Addresses" }}
              className="instance-ip-floating-badge"
              aria-label="Has a floating IP — open details"
            >
              <i className="fa fa-globe" /> Floating
            </Link>
          </InfoTooltip>
        )}
      </div>
      {more > 0 && (
        <Link
          to="/instances/$id"
          params={{ id: instanceId }}
          search={{ tab: "IP Addresses" }}
          className="instance-ip-more"
        >
          +{more} more
        </Link>
      )}
    </div>
  )
}
