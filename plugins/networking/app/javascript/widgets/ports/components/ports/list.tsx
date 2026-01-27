// @ts-expect-error - defeatable_link has no types
import { DefeatableLink } from "lib/components/defeatable_link"
import { TransitionGroup, CSSTransition } from "react-transition-group"
// @ts-expect-error - search_field has no types
import { SearchField } from "lib/components/search_field"
import PortItem from "./item"
// @ts-expect-error - ajax_paginate has no types
import { AjaxPaginate } from "lib/components/ajax_paginate"
import React, { useState, useCallback, useEffect } from "react"

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

const List: React.FC<ListProps> = (props) => {
  const filters = ["fixed ip ports", "other ports"]
  const [activeFilter, setActiveFilter] = useState<string>(() => {
    // Initialize with "fixed ip ports" (index 0) or first filter
    const index = filters.indexOf("fixed ip ports")
    return filters[index >= 0 ? index : 0]
  })

  const loadDependencies = useCallback(() => {
    props.loadPortsOnce()
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }, [props.loadPortsOnce, props.loadNetworksOnce, props.loadSubnetsOnce, props.loadSecurityGroupsOnce])

  // Mount and props changes: load dependencies
  useEffect(() => {
    loadDependencies()
  }, [loadDependencies])

  const changeActiveFilter = useCallback((name: string) => {
    setActiveFilter(name)
  }, [])

  const filterPorts = useCallback(() => {
    let items = props.items.filter(
      (i) =>
        (activeFilter === "other ports" && i.name !== "fixed_ip_allocation") ||
        (activeFilter === "fixed ip ports" && i.name === "fixed_ip_allocation")
    )

    if (!props.searchTerm) return items

    // filter items
    const regex = new RegExp(props.searchTerm.trim(), "i")

    return items.filter((i) => {
      const network = props.networks.items.find((n) => n.id === i.network_id)
      const values = { network: network ? network.name : "", subnet: "", ip: "" }

      const fixed_ips = i.fixed_ips || []
      for (const index in fixed_ips) {
        const ip = fixed_ips[index]
        const subnet = props.subnets.items.find((s) => s.id === ip.subnet_id)
        values.subnet = `${values.subnet} ${subnet ? subnet.name : ""}`
        values.ip = `${values.ip} ${ip.ip_address}`
      }
      return (
        `${i.id} ${i.description} ${values.ip} ${values.network} ${values.subnet} ${i.network_id} ${i.status}`.search(
          regex
        ) >= 0
      )
    })
  }, [props.items, props.searchTerm, props.networks.items, props.subnets.items, activeFilter])

  const networks = useCallback(() => {
    const networksObj: Record<string, Network> = {}
    for (const i in props.networks.items) {
      const network = props.networks.items[i]
      networksObj[network.id] = network
    }
    return networksObj
  }, [props.networks.items])

  const subnets = useCallback(() => {
    const subnetsObj: Record<string, Subnet> = {}
    for (const i in props.subnets.items) {
      const subnet = props.subnets.items[i]
      subnetsObj[subnet.id] = subnet
    }
    return subnetsObj
  }, [props.subnets.items])

  const toolbar = useCallback(() => {
    // return null if no items available
    if (props.items.length <= 0) return null

    return (
      <div className="toolbar">
        TEST
        <SearchField
          onChange={(term:string) => props.searchPorts(term)}
          placeholder="ID, IP, network, subnet or description"
          text="Searches by ID, IP, network, subnet or description in visible IP list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
        />

        {filters.length > 1 && ( // show filter checkboxes
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
  }, [props.items.length, props.searchPorts, filters, activeFilter, changeActiveFilter])

  const renderTable = useCallback(() => {
    const items = filterPorts()
    const networksObj = networks()
    const subnetsObj = subnets()
    const securityGroups = props.securityGroups

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
            {items && items.length > 0 ? (
              items.map(
                (port, index) =>
                  !port.isHidden && (
                    <TableRowFadeTransition key={index}>
                      <PortItem
                        port={port}
                        instancesPath={props.instancesPath}
                        handleDelete={props.handleDelete}
                        isFetchingNetworks={props.networks.isFetching}
                        isFetchingSubnets={props.subnets.isFetching}
                        network={networksObj[port.network_id]}
                        subnets={subnetsObj}
                      />
                    </TableRowFadeTransition>
                  )
              )
            ) : (
              <TableRowFadeTransition>
                <tr>
                  <td colSpan={6}>{props.isFetching ? <span className="spinner" /> : "No IPs found."}</td>
                </tr>
              </TableRowFadeTransition>
            )}
          </TransitionGroup>
        </table>

        <AjaxPaginate hasNext={props.hasNext} isFetching={props.isFetching} onLoadNext={props.loadNext} />
      </div>
    )
  }, [
    filterPorts,
    networks,
    subnets,
    props.securityGroups,
    props.instancesPath,
    props.handleDelete,
    props.networks.isFetching,
    props.subnets.isFetching,
    props.isFetching,
    props.hasNext,
    props.loadNext,
  ])

  return (
    <div>
      {toolbar()}
      {!policy.isAllowed("shared_filesystem_storage:share_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        renderTable()
      )}
    </div>
  )
}

export default List
