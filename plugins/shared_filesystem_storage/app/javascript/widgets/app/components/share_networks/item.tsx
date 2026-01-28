import React from "react"
import { Link } from "react-router-dom"
// @ts-expect-error - lib/components/Overlay has no TypeScript definitions
import { Tooltip } from "lib/components/Overlay"
// @ts-expect-error - lib/policy has no TypeScript definitions
import { policy } from "lib/policy"

interface Network {
  id: string
  name?: string
  "router:external"?: boolean
  shared?: boolean
}

interface Subnet {
  id: string
  name?: string
  cidr?: string
}

interface ShareNetwork {
  id: string
  name?: string
  isDeleting?: boolean
  isNew?: boolean
}

interface ItemProps {
  shareNetwork: ShareNetwork
  handleDelete: (id: string) => void
  network: Network | "loading" | undefined
  subnet: Subnet | "loading" | null
}

const emptyNetwork = `
    This network does not contain any shares or security services. Please note
    that once a share is created on this network, you will no longer be able to
    add a security service. Please add the security service first if necessary.
  `

const Item: React.FC<ItemProps> = ({ shareNetwork, handleDelete, network, subnet }) => {
  let className = ""
  if (shareNetwork.isDeleting) {
    className = "updating"
  } else if (shareNetwork.isNew) {
    className = "bg-info"
  }

  return (
    <tr className={className}>
      <td>
        {shareNetwork.isNew && (
          <Tooltip trigger="click" placement="top" content={emptyNetwork}>
            <a href="javascript:void(0)">
              <i className="fa fa-fw fa-info-circle" />
            </a>
          </Tooltip>
        )}
      </td>
      <td>
        {policy.isAllowed("shared_filesystem_storage:share_network_get") ? (
          <Link to={`/share-networks/${shareNetwork.id}/show`}>{shareNetwork.name || shareNetwork.id}</Link>
        ) : (
          shareNetwork.name || shareNetwork.id
        )}
      </td>
      <td>
        {network ? (
          network === "loading" ? (
            <span className="spinner" />
          ) : (
            <div>
              {network.name}
              {network["router:external"] && (
                <Tooltip placement="right" content="External Network">
                  <i className="fa fa-fw fa-globe" />
                </Tooltip>
              )}
              {network.shared && (
                <Tooltip placement="right" content="Shared Network">
                  <i className="fa fa-fw fa-share-alt" />
                </Tooltip>
              )}
            </div>
          )
        ) : (
          "Not found"
        )}
      </td>
      <td>
        {subnet ? (
          subnet === "loading" ? (
            <span className="spinner" />
          ) : (
            <div>
              {subnet.name} {subnet.cidr}
            </div>
          )
        ) : (
          "Not found"
        )}
      </td>
      <td className="snug">
        {(policy.isAllowed("shared_filesystem_storage:share_network_delete") ||
          policy.isAllowed("shared_filesystem_storage:share_network_update")) && (
          <div className="btn-group">
            <button
              className="btn btn-default btn-sm dropdown-toggle"
              type="button"
              data-toggle="dropdown"
              aria-expanded={true}
            >
              <span className="fa fa-cog" />
            </button>

            <ul className="dropdown-menu dropdown-menu-right" role="menu">
              {policy.isAllowed("shared_filesystem_storage:share_network_delete") && (
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(shareNetwork.id)
                    }}
                  >
                    Delete
                  </a>
                </li>
              )}
              {policy.isAllowed("shared_filesystem_storage:share_network_update") && (
                <li>
                  <Link to={`/share-networks/${shareNetwork.id}/edit`}>Edit</Link>
                </li>
              )}
              {policy.isAllowed("shared_filesystem_storage:share_network_update") && (
                <li>
                  <Link to={`/share-networks/${shareNetwork.id}/security-services`}>Security Services</Link>
                </li>
              )}
              <li>
                <Link to={`/share-networks/${shareNetwork.id}/error-log`}>Error Log</Link>
              </li>
            </ul>
          </div>
        )}
      </td>
    </tr>
  )
}

export default Item
