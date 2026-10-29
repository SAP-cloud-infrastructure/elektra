import React, { useEffect, useState } from "react"
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
  device_id?: string
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

type SortDirection = "asc" | "desc"

interface SortState {
  column: string | null
  direction: SortDirection
}

interface SortableHeaderProps {
  label: string
  column: string
  sort: SortState
  onSort: (column: string) => void
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, sort, onSort }) => {
  const active = sort.column === column
  const iconClass = !active ? "fa-sort" : sort.direction === "asc" ? "fa-sort-asc" : "fa-sort-desc"

  return (
    <th>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onSort(column)
        }}
        style={{ textDecoration: "none", color: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {label} <i className={`fa ${iconClass}`} style={{ opacity: active ? 1 : 0.4 }} />
      </a>
    </th>
  )
}

// A single grey placeholder bar used inside skeleton loading rows.
const SkeletonBar: React.FC<{ width?: string }> = ({ width = "80%" }) => (
  <span className="ports-skeleton-bar" style={{ width }} />
)

// Skeleton loading rows shown while the first page of ports is loading. They
// mirror the table's column layout so the content appears to "fill in" instead
// of popping in after a bare spinner.
const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <tbody data-testid="ports-skeleton">
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        <td className="snug">
          <SkeletonBar width="16px" />
        </td>
        <td>
          <SkeletonBar width="70%" />
          <br />
          <SkeletonBar width="40%" />
        </td>
        <td>
          <SkeletonBar width="60%" />
        </td>
        <td>
          <SkeletonBar width="65%" />
        </td>
        <td>
          <SkeletonBar width="55%" />
        </td>
        <td>
          <SkeletonBar width="65%" />
        </td>
        <td>
          <SkeletonBar width="50%" />
        </td>
        <td></td>
      </tr>
    ))}
  </tbody>
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
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" })
  // attachment filter: "all" | "attached" | "free"
  const [attachment, setAttachment] = useState<string>("all")

  useEffect(() => {
    loadPortsOnce()
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
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

  const onSort = (column: string) => {
    setSort((prev) => {
      // Cycle: asc -> desc -> no sort (back to the original order)
      if (prev.column !== column) return { column, direction: "asc" }
      if (prev.direction === "asc") return { column, direction: "desc" }
      return { column: null, direction: "asc" }
    })
  }

  // The sortable value for a port in a given column (name/description/network/status).
  const sortValue = (port: Port, column: string): string => {
    switch (column) {
      case "name":
        return (port.name || port.id || "").toLowerCase()
      case "description":
        return (port.description || "").toLowerCase()
      case "network": {
        const network = networks.items.find((n) => n.id === port.network_id)
        return (network ? network.name : port.network_id || "").toLowerCase()
      }
      case "status":
        return (port.status || "").toLowerCase()
      default:
        return ""
    }
  }

  const filterPorts = (): Port[] => {
    let result = items.filter((i) => !i.isHidden)

    // attachment filter: a port is "attached" when it has a device_id
    if (attachment === "attached") {
      result = result.filter((i) => !!i.device_id)
    } else if (attachment === "free") {
      result = result.filter((i) => !i.device_id)
    }

    if (searchTerm) {
      const regex = new RegExp(searchTerm.trim(), "i")

      result = result.filter((i) => {
        const network = networks.items.find((n) => n.id === i.network_id)
        const values: any = { network: network ? network.name : "", subnet: "", ip: "" }

        const fixed_ips = i.fixed_ips || []
        for (const ip of fixed_ips) {
          const subnet = subnets.items.find((s) => s.id === ip.subnet_id)
          values.subnet = `${values.subnet} ${subnet ? subnet.name : ""}`
          values.ip = `${values.ip} ${ip.ip_address}`
        }

        return (
          `${i.id} ${i.name} ${i.description} ${values.ip} ${values.network} ${values.subnet} ${i.network_id} ${i.status}`.search(
            regex
          ) >= 0
        )
      })
    }

    if (sort.column) {
      const dir = sort.direction === "asc" ? 1 : -1
      result = [...result].sort((a, b) => {
        const av = sortValue(a, sort.column as string)
        const bv = sortValue(b, sort.column as string)
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
        return 0
      })
    }

    return result
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

  // The currently visible ports (after attachment filter + search + sort).
  // Computed once so both the toolbar count and the table use the same list.
  const filteredItems = filterPorts()
  const visibleCount = filteredItems.length

  const renderToolbar = () => {
    if (items.length <= 0) return null

    return (
      <div className="toolbar">
        <SearchField
          onChange={(term: string) => searchPorts(term)}
          placeholder="ID, name, IP, network, subnet or description"
          text="Searches by ID, name, IP, network, subnet or description in visible IP list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
        />
        <span className="toolbar-input-divider"></span>
        <label>Show:</label>
        <select
          className="form-control"
          style={{ width: "auto" }}
          value={attachment}
          onChange={(e) => setAttachment(e.target.value)}
        >
          <option value="all">All ports</option>
          <option value="attached">Attached</option>
          <option value="free">Free</option>
        </select>
        <span className="toolbar-input-divider"></span>
        {visibleCount} {visibleCount === 1 ? "port" : "ports"}
        <div className="main-buttons">
          <DefeatableLink to="/ports/new" className="btn btn-primary">
            Reserve new IP
          </DefeatableLink>
        </div>
      </div>
    )
  }

  const renderTable = () => {
    const networksMap = getNetworks()
    const subnetsMap = getSubnets()

    return (
      <div>
        <table className="table shares">
          <thead>
            <tr>
              <th className="snug"></th>
              <SortableHeader label="Name / ID" column="name" sort={sort} onSort={onSort} />
              <SortableHeader label="Description" column="description" sort={sort} onSort={onSort} />
              <SortableHeader label="Network" column="network" sort={sort} onSort={onSort} />
              <th>Fixed IPs / Subnet</th>
              <th>Device Owner / ID</th>
              <SortableHeader label="Status" column="status" sort={sort} onSort={onSort} />
              <th></th>
            </tr>
          </thead>
          {isFetching && items.length === 0 ? (
            <SkeletonRows />
          ) : (
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
                    <td colSpan={6}>No IPs found.</td>
                  </tr>
                </TableRowFadeTransition>
              )}
            </TransitionGroup>
          )}
        </table>

        {/* Only let AjaxPaginate show its own loading spinner while loading
            MORE items (i.e. when some are already shown). During the initial
            load the empty table already shows a spinner, so we avoid a second
            one here. */}
        <AjaxPaginate hasNext={hasNext} isFetching={isFetching && items.length > 0} onLoadNext={loadNext} />
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
