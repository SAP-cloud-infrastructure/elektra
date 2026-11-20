import { Link } from "@tanstack/react-router"
import { InfoTooltip } from "lib/components/InfoTooltip"
import type { InstanceIps } from "../../../types/instance"

const FLOATING_HELP =
  "Floating IP — an external, assignable address through which this server is reachable from outside the project network. Click to see all IPs."

const FIXED_HELP = "Fixed IP — an internal address on the project network, not reachable from outside."

interface IpListProps {
  ips: InstanceIps
  instanceId: string
}

// Compact IP cell. The externally reachable floating IP is the operationally
// most relevant address, so when present it is shown as the primary line (with
// a globe marker, linking to the detail IP tab), with the first fixed IP beneath
// it. Without a floating IP, the first fixed IP is the primary line. Each line
// carries a type marker — a globe for floating, a sitemap for fixed — so the
// address type is always unambiguous, even when only one line is shown. Any
// further (hidden) IPs are counted by a "+N more" link placed right after the
// fixed IP — they are additional fixed addresses, so they belong on the fixed
// line.
export function IpList({ ips, instanceId }: IpListProps) {
  if (!ips || ips.length === 0) return <span className="text-muted">—</span>

  const floating = ips.find((ip) => ip.type === "floating") ?? null
  const fixed = ips.filter((ip) => ip.type === "fixed")
  const primaryFixed = fixed[0] ?? ips.find((ip) => ip.type !== "floating") ?? null

  // Inline we show the floating IP (if any) and one fixed IP; count the rest.
  const shownCount = (floating ? 1 : 0) + (primaryFixed ? 1 : 0)
  const more = Math.max(ips.length - shownCount, 0)

  const moreLink = more > 0 && (
    <Link to="/instances/$id" params={{ id: instanceId }} search={{ tab: "IP Addresses" }} className="instance-ip-more">
      +{more} more
    </Link>
  )

  // The fixed-IP line: a sitemap marker (internal network) + the address, with
  // the "+N more" link appended right after it. Muted when it sits beneath a
  // floating IP, body-coloured when it is the only (primary) line.
  const fixedLine = (
    <span className="instance-ip-fixed-line">
      {primaryFixed && (
        <InfoTooltip content={FIXED_HELP} maxWidth="20rem">
          <span className={floating ? "instance-ip-secondary" : "instance-ip-addr"}>
            <i className="fa fa-sitemap instance-ip-marker" aria-hidden="true" /> {primaryFixed.addr}
          </span>
        </InfoTooltip>
      )}
      {moreLink}
    </span>
  )

  return (
    <div className="instance-ips">
      {floating && (
        <InfoTooltip content={FLOATING_HELP} maxWidth="20rem">
          <Link
            to="/instances/$id"
            params={{ id: instanceId }}
            search={{ tab: "IP Addresses" }}
            className="instance-ip-floating"
            aria-label="Floating IP — open details"
          >
            <i className="fa fa-globe instance-ip-marker" aria-hidden="true" /> {floating.addr}
          </Link>
        </InfoTooltip>
      )}
      {(primaryFixed || more > 0) && fixedLine}
    </div>
  )
}
