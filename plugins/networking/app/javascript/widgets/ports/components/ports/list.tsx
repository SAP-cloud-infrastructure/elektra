// @ts-expect-error - defeatable_link has no types
import { DefeatableLink } from "lib/components/defeatable_link"
import { TransitionGroup, CSSTransition } from "react-transition-group"
// @ts-expect-error - search_field has no types
import { SearchField } from "lib/components/search_field"
import PortItem from "./item"
// @ts-expect-error - ajax_paginate has no types
import { AjaxPaginate } from "lib/components/ajax_paginate"
import React, { useState, useCallback, useEffect, useMemo } from "react"

// Global policy object
declare const policy: {
  isAllowed: (action: string, context?: any) => boolean
}

const TableRowFadeTransition = ({ children, ...props }: any) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

interface Port {
  id: string
  name: string
  description?: string
  network_id: string
  status: string
  fixed_ips?: Array<{ subnet_id: string; ip_address: string }>
  device_owner?: string
  device_id?: string
  isHidden?: boolean
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
  cidr?: string
}

interface SecurityGroup {
  id: string
  name: string
  items?: SecurityGroup[]
}

interface ListProps {
  items: Port[]
  networks: { items: Network[]; isFetching: boolean }
  subnets: { items: Subnet[]; isFetching: boolean }
  securityGroups: { items: SecurityGroup[] }
  isFetching: boolean
  hasNext: boolean
  searchTerm: string
  instancesPath: string
  loadPortsOnce: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  searchPorts: (term: string) => void
  handleDelete: (portId: string) => void
  loadNext: () => void
}

const FILTERS = ["fixed ip ports", "other ports"] as const

const List: React.FC<ListProps> = (props) => {
  const [activeFilter, setActiveFilter] = useState<string>(() => {
    // Initialize with "fixed ip ports" (index 0) or first filter
    const index = FILTERS.indexOf("fixed ip ports")
    return FILTERS[index >= 0 ? index : 0]
  })

  // Mount: load dependencies
  useEffect(() => {
    props.loadPortsOnce()
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }, [props.loadPortsOnce, props.loadNetworksOnce, props.loadSubnetsOnce, props.loadSecurityGroupsOnce])

  const changeActiveFilter = useCallback((name: string) => {
    setActiveFilter(name)
  }, [])

  // Memoize network and subnet maps for efficient lookup
  const networksMap = useMemo(() => {
    const networksObj: Record<string, Network> = {}
    for (const network of props.networks.items) {
      networksObj[network.id] = network
    }
    return networksObj
  }, [props.networks.items])

  const subnetsMap = useMemo(() => {
    const subnetsObj: Record<string, Subnet> = {}
    for (const subnet of props.subnets.items) {
      subnetsObj[subnet.id] = subnet
    }
    return subnetsObj
  }, [props.subnets.items])

  // Filter ports based on active filter and search term
  const filteredPorts = useMemo(() => {
    let items = props.items.filter(
      (i) =>
        (activeFilter === "other ports" && i.name !== "fixed_ip_allocation") ||
        (activeFilter === "fixed ip ports" && i.name === "fixed_ip_allocation")
    )

    if (!props.searchTerm) return items

    // filter items
    const regex = new RegExp(props.searchTerm.trim(), "i")

    return items.filter((i) => {
      const network = networksMap[i.network_id]
      const values = { network: network ? network.name : "", subnet: "", ip: "" }

      const fixed_ips = i.fixed_ips || []
      for (const ip of fixed_ips) {
        const subnet = subnetsMap[ip.subnet_id]
        values.subnet = `${values.subnet} ${subnet ? subnet.name : ""}`
        values.ip = `${values.ip} ${ip.ip_address}`
      }
      return (
        `${i.id} ${i.description} ${values.ip} ${values.network} ${values.subnet} ${i.network_id} ${i.status}`.search(
          regex
        ) >= 0
      )
    })
  }, [props.items, props.searchTerm, networksMap, subnetsMap, activeFilter])

  const toolbar = useMemo(() => {
    // return null if no items available
    if (props.items.length <= 0) return null

    return (
      <div className="toolbar">
        <SearchField
          onChange={(term: string) => props.searchPorts(term)}
          placeholder="ID, IP, network, subnet or description"
          text="Searches by ID, IP, network, subnet or description in visible IP list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
        />

        {FILTERS.length > 1 && ( // show filter checkboxes
          <>
            <span className="toolbar-input-divider"></span>
            <label>Show:</label>
            {FILTERS.map((name) => (
              <label className="radio-inline" key={name}>
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
  }, [props.items.length, props.searchPorts, activeFilter, changeActiveFilter])

  return (
    <div>
      {toolbar}
      {!policy.isAllowed("shared_filesystem_storage:share_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
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
              {filteredPorts && filteredPorts.length > 0 ? (
                filteredPorts.map(
                  (port) =>
                    !port.isHidden && (
                      <TableRowFadeTransition key={port.id}>
                        <PortItem
                          port={port}
                          instancesPath={props.instancesPath}
                          handleDelete={props.handleDelete}
                          isFetchingNetworks={props.networks.isFetching}
                          isFetchingSubnets={props.subnets.isFetching}
                          network={networksMap[port.network_id]}
                          subnets={subnetsMap}
                        />
                      </TableRowFadeTransition>
                    )
                )
              ) : (
                <TableRowFadeTransition key="no-items">
                  <tr>
                    <td colSpan={8}>{props.isFetching ? <span className="spinner" /> : "No IPs found."}</td>
                  </tr>
                </TableRowFadeTransition>
              )}
            </TransitionGroup>
          </table>

          <AjaxPaginate hasNext={props.hasNext} isFetching={props.isFetching} onLoadNext={props.loadNext} />
        </div>
      )}
    </div>
  )
}

export default List
