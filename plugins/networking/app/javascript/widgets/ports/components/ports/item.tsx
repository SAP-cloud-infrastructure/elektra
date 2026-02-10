/* eslint-disable no-undef */
import React from "react"
import { Link } from "react-router-dom"
// @ts-expect-error - lib/tools/helpers has no types
import { truncate } from "lib/tools/helpers"
// @ts-expect-error - lib/components/Overlay has no types
import { Tooltip } from "lib/components/Overlay"

// Types
interface FixedIP {
  ip_address: string
  subnet_id: string
}

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  device_id?: string
  device_owner?: string
  status?: string
  fixed_ips?: FixedIP[]
  isDeleting?: boolean
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
}

interface SubnetsMap {
  [key: string]: Subnet
}

interface AttachedIconProps {
  port: Port
}

interface ItemProps {
  port: Port
  instancesPath?: string
  network: Network | null
  isFetchingNetworks: boolean
  subnets: SubnetsMap
  isFetchingSubnets: boolean
  handleDelete: (portId: string) => void
}

export const AttachedIcon: React.FC<AttachedIconProps> = ({ port }) => {
  if (!port.device_id) return null

  return (
    <Tooltip content="Port is attached" placement="top">
      <i className="fa fa-fw fa-paperclip" />
    </Tooltip>
  )
}

const Item: React.FC<ItemProps> = ({
  port,
  instancesPath,
  network,
  isFetchingNetworks,
  subnets,
  isFetchingSubnets,
  handleDelete,
}) => {
  const FIXED = "fixed_ip_allocation"
  const canDelete =
    policy.isAllowed("networking:port_delete", { port: port }) && (!port.device_id || port.name == FIXED)
  const canUpdate = policy.isAllowed("networking:port_update", { port: port })

  return (
    <tr className={port.isDeleting ? "updating" : ""}>
      <td>
        <AttachedIcon port={port} />
      </td>
      <td>
        {policy.isAllowed("networking:port_get", { port: port }) ? (
          <Link to={`/ports/${port.id}/show`}>{port.description || truncate(port.id, 20)}</Link>
        ) : (
          port.name || truncate(port.id, 20)
        )}
      </td>
      <td>{port.description}</td>
      <td>
        {(network && network.name) || port.network_id}
        {isFetchingNetworks && <span className="spinner"></span>}
      </td>
      <td>
        {(port.fixed_ips || []).map((ip, index) => (
          <div key={index}>
            {ip.ip_address}
            <br />
            {isFetchingSubnets ? (
              <span className="spinner"></span>
            ) : (
              <span className="info-text">{(subnets[ip.subnet_id] || {}).name || truncate(ip.subnet_id, 20)}</span>
            )}
          </div>
        ))}
      </td>
      <td>
        {port.device_owner}
        {port.device_id && (
          <>
            <br />
            <span className="info-text">
              {port.device_owner && port.device_owner.indexOf("compute:") >= 0 ? (
                <a href={`${instancesPath}/${port.device_id}`} data-modal="true">
                  {truncate(port.device_id, 20)}
                </a>
              ) : (
                truncate(port.device_id, 20)
              )}
            </span>
          </>
        )}
      </td>
      <td>{port.status}</td>

      <td className="snug">
        <div className="btn-group">
          <button
            className="btn btn-default btn-sm dropdown-toggle"
            type="button"
            data-toggle="dropdown"
            aria-expanded="true"
          >
            <i className="fa fa-cog"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-right" role="menu">
            <li>
              <Link to={`/ports/${port.id}/show`}>Show</Link>
            </li>
            {canUpdate && (
              <li>
                <Link to={`/ports/${port.id}/edit`}>Edit</Link>
              </li>
            )}
            {canDelete && (
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(port.id)
                  }}
                >
                  Delete
                </a>
              </li>
            )}
          </ul>
        </div>
      </td>
    </tr>
  )
}

export default Item
