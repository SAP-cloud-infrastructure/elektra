/* eslint-disable no-undef */
import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
// @ts-expect-error - no types available
import { DefeatableLink } from "lib/components/defeatable_link"
import { TransitionGroup, CSSTransition } from "react-transition-group"
// @ts-expect-error - no types available
import { SearchField } from "lib/components/search_field"
import PortItem from "./item"
// @ts-expect-error - no types available
import { AjaxPaginate } from "lib/components/ajax_paginate"

declare const policy: {
  isAllowed: (action: string, context?: unknown) => boolean
}

interface FixedIP {
  subnet_id: string
  ip_address: string
}

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  fixed_ips?: FixedIP[]
  status: string
  isHidden?: boolean
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
}

interface NetworkState {
  items: Network[]
  isFetching: boolean
}

interface SubnetState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroup {
  id: string
  name: string
}

interface ListProps {
  items: Port[]
  networks: NetworkState
  subnets: SubnetState
  securityGroups: SecurityGroup[]
  isFetching: boolean
  hasNext: boolean
  searchTerm?: string
  instancesPath?: string
  loadPortsOnce: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  searchPorts: (term: string) => void
  handleDelete: (id: string) => void
  loadNext: () => void
}

const TableRowFadeTransition: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

const List: React.FC<ListProps> = ({
  items,
  networks,
  subnets,
  securityGroups,
  isFetching,
  hasNext,
  searchTerm,
  instancesPath,
  loadPortsOnce,
  loadNetworksOnce,
  loadSubnetsOnce,
  loadSecurityGroupsOnce,
  searchPorts,
  handleDelete,
  loadNext,
}) => {
  const filters = ["fixed ip ports", "other ports"]
  const [activeFilter, setActiveFilter] = useState<string>("fixed ip ports")

  // Load dependencies on mount and when props change
  useEffect(() => {
    loadPortsOnce()
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
  }, [loadPortsOnce, loadNetworksOnce, loadSubnetsOnce, loadSecurityGroupsOnce])

  const changeActiveFilter = (name: string) => {
    setActiveFilter(name)
  }

  const networksMap = useMemo(() => {
    const map: { [key: string]: Network } = {}
    for (const network of networks.items) {
      map[network.id] = network
    }
    return map
  }, [networks.items])

  const subnetsMap = useMemo(() => {
    const map: { [key: string]: Subnet } = {}
    for (const subnet of subnets.items) {
      map[subnet.id] = subnet
    }
    return map
  }, [subnets.items])

  const filteredPorts = useMemo(() => {
    let filteredItems = items.filter(
      (i) =>
        (activeFilter === "other ports" && i.name !== "fixed_ip_allocation") ||
        (activeFilter === "fixed ip ports" && i.name === "fixed_ip_allocation")
    )

    if (!searchTerm) return filteredItems

    // filter items
    const regex = new RegExp(searchTerm.trim(), "i")

    return filteredItems.filter((i) => {
      const network = networks.items.find((n) => n.id === i.network_id)
      const values = { network: network ? network.name : "", subnet: "", ip: "" }

      const fixed_ips = i.fixed_ips || []
      for (const ip of fixed_ips) {
        const subnet = subnets.items.find((s) => s.id === ip.subnet_id)
        values.subnet = `${values.subnet} ${subnet ? subnet.name : ""}`
        values.ip = `${values.ip} ${ip.ip_address}`
      }
      return (
        `${i.id} ${i.description || ""} ${values.ip} ${values.network} ${values.subnet} ${i.network_id} ${i.status}`.search(
          regex
        ) >= 0
      )
    })
  }, [items, activeFilter, searchTerm, networks.items, subnets.items])

  const toolbar = () => {
    // return null if no items available
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
  }

  const renderTable = () => {
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
            {filteredPorts && filteredPorts.length > 0 ? (
              filteredPorts.map(
                (port, index) =>
                  !port.isHidden && (
                    <TableRowFadeTransition key={port.id}>
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
              <TableRowFadeTransition key="empty">
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
