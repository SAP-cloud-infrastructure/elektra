import React, { useState, useEffect, useRef } from "react"
import { TransitionGroup, CSSTransition } from "react-transition-group"
// @ts-expect-error - defeatable_link has no types
import { DefeatableLink } from "lib/components/defeatable_link"
// @ts-expect-error - search_field has no types
import { SearchField } from "lib/components/search_field"
// @ts-expect-error - ajax_paginate has no types
import { AjaxPaginate } from "lib/components/ajax_paginate"
import PortItem from "./item"

// Types
interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  fixed_ips?: Array<{ ip_address: string; subnet_id: string }>
  status?: string
  isHidden?: boolean
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
  network_id: string
}

interface SecurityGroup {
  id: string
  name: string
}

interface NetworksState {
  items: Network[]
  isFetching: boolean
}

interface SubnetsState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroupsState {
  items: SecurityGroup[]
  isFetching: boolean
}

interface PortListProps {
  items: Port[]
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
  searchTerm?: string
  isFetching: boolean
  hasNext: boolean
  instancesPath?: string
  loadPortsOnce: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  searchPorts: (term: string) => void
  loadNext: () => void
  handleDelete: (portId: string) => void
}

const TableRowFadeTransition: React.FC<any> = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

const PortList: React.FC<PortListProps> = ({
  items,
  networks,
  subnets,
  securityGroups,
  searchTerm,
  isFetching,
  hasNext,
  instancesPath,
  loadPortsOnce,
  loadNetworksOnce,
  loadSubnetsOnce,
  loadSecurityGroupsOnce,
  searchPorts,
  loadNext,
  handleDelete,
}) => {
  const [filters] = useState(["fixed ip ports", "other ports"])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const isFirstRenderForFilter = useRef(true)

  useEffect(() => {
    loadPortsOnce()
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()

    // Set initial active filter after first effect runs (mimics UNSAFE_componentWillReceiveProps behavior)
    // This only runs after props are received, not on the very first render
    if (isFirstRenderForFilter.current) {
      isFirstRenderForFilter.current = false
    } else if (activeFilter === null) {
      const index = filters.indexOf("fixed ip ports")
      setActiveFilter(filters[index >= 0 ? index : 0])
    }
  }, [
    loadPortsOnce,
    loadNetworksOnce,
    loadSubnetsOnce,
    loadSecurityGroupsOnce,
    items,
    networks,
    subnets,
    securityGroups,
  ])

  const changeActiveFilter = (name: string) => {
    setActiveFilter(name)
  }

  const filterPorts = (): Port[] => {
    // If activeFilter is null, return empty array (initial state before filter is set)
    if (activeFilter === null) {
      return []
    }

    let filteredItems = items.filter(
      (i) =>
        (activeFilter === "other ports" && i.name !== "fixed_ip_allocation") ||
        (activeFilter === "fixed ip ports" && i.name === "fixed_ip_allocation")
    )

    if (!searchTerm) return filteredItems

    const regex = new RegExp(searchTerm.trim(), "i")

    return filteredItems.filter((i) => {
      const network = networks.items.find((n) => n.id === i.network_id)
      const values: any = { network: network ? network.name : "", subnet: "", ip: "" }

      const fixed_ips = i.fixed_ips || []
      for (const ip of fixed_ips) {
        const subnet = subnets.items.find((s) => s.id === ip.subnet_id)
        values.subnet = `${values.subnet} ${subnet ? subnet.name : ""}`
        values.ip = `${values.ip} ${ip.ip_address}`
      }

      return (
        `${i.id} ${i.description} ${values.ip} ${values.network} ${values.subnet} ${i.network_id} ${i.status}`.search(
          regex
        ) >= 0
      )
    })
  }

  const getNetworks = (): Record<string, Network> => {
    const networksMap: Record<string, Network> = {}
    for (const network of networks.items) {
      networksMap[network.id] = network
    }
    return networksMap
  }

  const getSubnets = (): Record<string, Subnet> => {
    const subnetsMap: Record<string, Subnet> = {}
    for (const subnet of subnets.items) {
      subnetsMap[subnet.id] = subnet
    }
    return subnetsMap
  }

  const renderToolbar = () => {
    if (items.length <= 0) return null

    return (
      <div className="toolbar">
        <SearchField
          onChange={(term: string) => searchPorts(term)}
          placeholder="ID, IP, network, subnet or description"
          text="Searches by ID, IP, network, subnet or description in visible IP list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
        />

        {filters.length > 1 && (
          <>
            <span className="toolbar-input-divider"></span>
            <label>Show:</label>
            {filters.map((name, index) => (
              <label className="radio-inline" key={index}>
                <input type="radio" onChange={() => changeActiveFilter(name)} checked={activeFilter === name} />
                {name}
              </label>
            ))}
          </>
        )}
        {activeFilter === "fixed ip ports" && (
          <div className="main-buttons">
            <DefeatableLink to="/ports/new" className="btn btn-primary">
              Reserve new IP
            </DefeatableLink>
          </div>
        )}
      </div>
    )
  }

  const renderTable = () => {
    const filteredItems = filterPorts()
    const networksMap = getNetworks()
    const subnetsMap = getSubnets()

    return (
      <div>
        <table className="table shares">
          <thead>
            <tr>
              <th className="snug"></th>
              <th>Port ID / Name</th>
              <th>Description</th>
              <th>Network</th>
              <th>Fixed IPs / Subnet</th>
              <th>Device Owner / ID</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <TransitionGroup component="tbody">
            {filteredItems && filteredItems.length > 0 ? (
              filteredItems.map(
                (port, index) =>
                  !port.isHidden && (
                    <TableRowFadeTransition key={index}>
                      <PortItem
                        port={port}
                        instancesPath={instancesPath}
                        handleDelete={handleDelete}
                        isFetchingNetworks={networks.isFetching}
                        isFetchingSubnets={subnets.isFetching}
                        network={networksMap[port.network_id]}
                        subnets={subnetsMap}
                      />
                    </TableRowFadeTransition>
                  )
              )
            ) : (
              <TableRowFadeTransition>
                <tr>
                  <td colSpan={6}>{isFetching ? <span className="spinner" /> : "No IPs found."}</td>
                </tr>
              </TableRowFadeTransition>
            )}
          </TransitionGroup>
        </table>

        <AjaxPaginate hasNext={hasNext} isFetching={isFetching} onLoadNext={loadNext} />
      </div>
    )
  }

  return (
    <div>
      {renderToolbar()}
      {!(window as any).policy?.isAllowed?.("shared_filesystem_storage:share_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        renderTable()
      )}
    </div>
  )
}

export default PortList
