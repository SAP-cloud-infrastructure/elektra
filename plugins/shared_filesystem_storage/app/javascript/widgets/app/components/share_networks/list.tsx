/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useMemo } from "react"
// @ts-expect-error - lib/components/defeatable_link has no TypeScript definitions
import { DefeatableLink } from "lib/components/defeatable_link"
// @ts-expect-error - lib/policy has no TypeScript definitions
import { policy } from "lib/policy"
// @ts-expect-error - lib/components/Overlay has no TypeScript definitions
import { Popover } from "lib/components/Overlay"
import ShareNetworkItem from "./item"

interface Network {
  id: string
  name?: string
}

interface Subnet {
  id: string
  name?: string
}

interface ShareNetwork {
  id: string
  name?: string
  neutron_net_id: string
  neutron_subnet_id: string
}

interface SubnetsState {
  [key: string]: {
    isFetching: boolean
    items?: Subnet[]
  }
}

interface ShareNetworkListProps {
  active: boolean
  isFetching: boolean
  shareNetworks: ShareNetwork[]
  networks: {
    isFetching: boolean
    items?: Network[]
  }
  subnets: SubnetsState
  loadShareNetworksOnce: () => void
  loadSecurityServicesOnce: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: (networkId: string) => void
  handleDelete: (id: string) => void
}

const CreateNewButton: React.FC = () => {
  if (!policy.isAllowed("shared_filesystem_storage:share_network_create")) {
    return (
      <Popover
        title="Missing Create Permission"
        content="You don't have permission to create a share network. Please check if you
        have the role sharedfilesystem_admin."
        placement="top"
      >
        <button className="btn btn-primary disabled">
          <i className="fa fa-fw fa-exclamation-triangle fa-2"></i> Create New
        </button>
      </Popover>
    )
  }

  return (
    <DefeatableLink to="/share-networks/new" className="btn btn-primary">
      Create New
    </DefeatableLink>
  )
}

const ShareNetworkList: React.FC<ShareNetworkListProps> = ({
  active,
  isFetching,
  shareNetworks,
  networks,
  subnets,
  loadShareNetworksOnce,
  loadSecurityServicesOnce,
  loadNetworksOnce,
  loadSubnetsOnce,
  handleDelete,
}) => {
  useEffect(() => {
    if (active) {
      loadShareNetworksOnce()
      loadSecurityServicesOnce()
      loadNetworksOnce()
      for (const shareNetwork of shareNetworks) {
        loadSubnetsOnce(shareNetwork.neutron_net_id)
      }
    }
  }, [active, shareNetworks, loadShareNetworksOnce, loadSecurityServicesOnce, loadNetworksOnce, loadSubnetsOnce])

  const getNetwork = (shareNetwork: ShareNetwork): Network | "loading" | undefined => {
    if (networks.isFetching) return "loading"
    if (!networks.items) return undefined
    return networks.items.find((item) => item.id === shareNetwork.neutron_net_id)
  }

  const getSubnet = (shareNetwork: ShareNetwork): Subnet | "loading" | null => {
    const networkSubnets = subnets[shareNetwork.neutron_net_id]
    if (!networkSubnets) return null
    if (networkSubnets.isFetching) return "loading"
    if (!networkSubnets.items) return null
    return networkSubnets.items.find((item) => item.id === shareNetwork.neutron_subnet_id) || null
  }

  return (
    <>
      <div className="toolbar">
        <div className="main-buttons">
          <CreateNewButton />
        </div>
      </div>

      {isFetching ? (
        <div>
          <span className="spinner" />
          Loading...
        </div>
      ) : (
        <table className="table share-networks">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Neutron Net</th>
              <th>Neutron Subnet</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shareNetworks.length === 0 && (
              <tr>
                <td colSpan={5}>No Share Networks found.</td>
              </tr>
            )}
            {shareNetworks.map((shareNetwork) => (
              <ShareNetworkItem
                key={shareNetwork.id}
                shareNetwork={shareNetwork}
                handleDelete={handleDelete}
                network={getNetwork(shareNetwork)}
                subnet={getSubnet(shareNetwork)}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default ShareNetworkList
