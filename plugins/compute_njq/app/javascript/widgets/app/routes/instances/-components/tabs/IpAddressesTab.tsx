import type { DetailNetworkIps } from "../../../../types/instance"
import { InfoTooltip } from "lib/components/InfoTooltip"
import { InlineLoading } from "./InlineLoading"
import { CopyableValue } from "../CopyableValue"

interface IpAddressesTabProps {
  networks: DetailNetworkIps[]
  loading?: boolean
}

const FIXED_HELP = "Fixed IP — an internal address on the project network, not reachable from outside."
const FLOATING_HELP =
  "Floating IP — an external, assignable address through which this server is reachable from outside the project network."

// IP Addresses tab — grouped by network name. Each row shows the fixed IP (with
// its MAC) and, when present, the paired floating IP. Icons and tooltips mirror
// the overview list's IP cell (fixed = sitemap/internal, floating = globe/
// external), and every address carries a copy-to-clipboard button.
export function IpAddressesTab({ networks, loading = false }: IpAddressesTabProps) {
  if (loading && networks.length === 0) return <InlineLoading />

  return (
    <table className="table datatable">
      <tbody>
        {networks.map((network) => (
          <tr key={network.network_name}>
            <th>{network.network_name}</th>
            <td>
              {network.ips.map((ip) => (
                <div className="details-ips" key={ip.fixed.addr}>
                  <div className="ip-container">
                    <InfoTooltip content={FIXED_HELP} maxWidth="20rem">
                      <span className="details-ip-type">
                        <i className="fa fa-sitemap fa-fw details-ip-icon" aria-hidden="true" /> Fixed
                      </span>
                    </InfoTooltip>
                    <span className="details-ip-value">
                      <CopyableValue value={ip.fixed.addr} label="IP address" />
                      {ip.fixed.mac && (
                        <span className="details-ip-mac info-text">
                          MAC <CopyableValue value={ip.fixed.mac} label="MAC address" />
                        </span>
                      )}
                    </span>
                  </div>
                  {ip.floating && (
                    <>
                      <i className="fa fa-arrow-right delimiter" aria-hidden="true" />
                      <div className="ip-container">
                        <InfoTooltip content={FLOATING_HELP} maxWidth="20rem">
                          <span className="details-ip-type">
                            <i className="fa fa-globe fa-fw details-ip-icon" aria-hidden="true" /> Floating
                          </span>
                        </InfoTooltip>
                        <span className="details-ip-value">
                          <CopyableValue value={ip.floating.addr} label="IP address" />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
