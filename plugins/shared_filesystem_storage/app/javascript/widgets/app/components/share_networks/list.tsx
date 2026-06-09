import React, { useEffect } from "react"
import { policy } from "lib/policy"
import { DefeatableLink } from "lib/components/defeatable_link"
import { Popover } from "lib/components/Overlay"
import ShareNetworkItem from "./item"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareNetwork {
  id: string
  name?: string
  neutron_net_id: string
  neutron_subnet_id?: string
}

interface NetworkItem {
  id: string
  name?: string
}

interface NetworksState {
  isFetching: boolean
  items: NetworkItem[]
}

interface SubnetItem {
  id: string
  name?: string
}

interface SubnetsForNetwork {
  isFetching: boolean
  items: SubnetItem[]
}

interface ShareNetworkListProps {
  active: boolean
  isFetching: boolean
  shareNetworks: ShareNetwork[]
  networks: NetworksState
  subnets: Record<string, SubnetsForNetwork>
  handleDelete: (id: string) => void
  policy: { isAllowed: (permission: string) => boolean }
  loadShareNetworksOnce: () => void
  loadSecurityServicesOnce: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: (neutronNetId: string) => void
}

// ─── Create button ────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const ShareNetworkList: React.FC<ShareNetworkListProps> = ({
  active,
  isFetching,
  shareNetworks,
  networks,
  subnets,
  handleDelete,
  loadShareNetworksOnce,
  loadSecurityServicesOnce,
  loadNetworksOnce,
  loadSubnetsOnce,
}) => {
  useEffect(() => {
    if (!active) return
    loadShareNetworksOnce()
    loadSecurityServicesOnce()
    loadNetworksOnce()
    shareNetworks.forEach((sn) => loadSubnetsOnce(sn.neutron_net_id))
  }, [active, shareNetworks]) // eslint-disable-line react-hooks/exhaustive-deps

  const network = (shareNetwork: ShareNetwork): NetworkItem | string => {
    if (networks.isFetching) return "loading"
    if (!networks.items) return ""
    return networks.items.find((item) => item.id === shareNetwork.neutron_net_id) ?? ""
  }

  const subnet = (shareNetwork: ShareNetwork): SubnetItem | null | string => {
    const networkSubnets = subnets[shareNetwork.neutron_net_id]
    if (!networkSubnets) return null
    if (networkSubnets.isFetching) return "loading"
    if (!networkSubnets.items) return null
    return networkSubnets.items.find((item) => item.id === shareNetwork.neutron_subnet_id) ?? null
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
                network={network(shareNetwork)}
                subnet={subnet(shareNetwork)}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default ShareNetworkList
