import type { DetailNetworkIps } from "../../../../types/instance"
import { InlineLoading } from "./InlineLoading"

interface IpAddressesTabProps {
  networks: DetailNetworkIps[]
  loading?: boolean
}

// IP Addresses tab — grouped by network name; each fixed IP shows its MAC and,
// when present, the paired floating IP. Mirrors the legacy ip_addresses table.
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
                    <i className="fa fa-desktop fa-fw" />
                    <span>
                      {ip.fixed.addr}
                      {ip.fixed.mac && <span className="info-text">(mac: {ip.fixed.mac})</span>}
                    </span>
                  </div>
                  {ip.floating && (
                    <>
                      <i className="fa fa-arrows-h delimiter" />
                      <div className="ip-container">
                        <i className="fa fa-globe fa-fw" />
                        <span>{ip.floating.addr}</span>
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
