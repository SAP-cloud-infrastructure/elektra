import React, { useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
// @ts-expect-error - lib/components/defeatable_link has no TypeScript definitions
import { DefeatableLink } from "lib/components/defeatable_link"
// @ts-expect-error - lib/components/Overlay has no TypeScript definitions
import { Popover, Tooltip } from "lib/components/Overlay"
import { TransitionGroup, CSSTransition } from "react-transition-group"
// @ts-expect-error - lib/components/transitions has no TypeScript definitions
import { FadeTransition } from "lib/components/transitions"
// @ts-expect-error - lib/policy has no TypeScript definitions
import { policy } from "lib/policy"
// @ts-expect-error - lib/components/search_field has no TypeScript definitions
import { SearchField } from "lib/components/search_field"
import ShareItem from "./item"
// @ts-expect-error - lib/components/ajax_paginate has no TypeScript definitions
import { AjaxPaginate } from "lib/components/ajax_paginate"

interface ShareNetwork {
  id: string
  name?: string
}

interface Rule {
  id: string
  access_level: string
  access_to: string
}

interface ShareRule {
  isFetching: boolean
  items: Rule[]
}

interface Share {
  id: string
  name?: string
  share_network_id: string
  status: string
  share_proto?: string
  export_locations?: string[]
  isHidden?: boolean
}

interface ShareNetworksData {
  items: ShareNetwork[]
  isFetching: boolean
}

interface ShareRulesData {
  [key: string]: ShareRule
}

interface ListProps {
  active: boolean
  items: Share[]
  shareNetworks: ShareNetworksData
  shareRules: ShareRulesData
  searchTerm: string
  isFetching: boolean
  hasNext: boolean
  policy: unknown
  loadSharesOnce: () => void
  loadShareNetworksOnce: () => void
  loadAvailabilityZonesOnce: () => void
  loadShareRulesOnce: (shareId: string) => void
  searchShares: (term: string) => void
  handleDelete: (id: string) => void
  handleForceDelete: (id: string) => void
  reloadShare: (id: string) => void
  loadNext: () => void
}

interface TableRowFadeTransitionProps {
  children: React.ReactNode
  [key: string]: unknown
}

const TableRowFadeTransition: React.FC<TableRowFadeTransitionProps> = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

interface CreateNewButtonProps {
  fetchingShareNetworks: boolean
  hasShareNetworks: boolean
}

const CreateNewButton: React.FC<CreateNewButtonProps> = ({ fetchingShareNetworks, hasShareNetworks }) => {
  if (fetchingShareNetworks) {
    return (
      <Popover title="Loading Share Networks" content=" Please wait..." placement="top">
        <button className="btn btn-primary disabled loading">Create New</button>
      </Popover>
    )
  }

  if (!hasShareNetworks) {
    return (
      <Popover title="No Share Network found" content="Please create a Share Network first." placement="top">
        <button className="btn btn-primary disabled">
          <i className="fa fa-fw fa-exclamation-triangle fa-2"></i> Create New
        </button>
      </Popover>
    )
  }

  return (
    <DefeatableLink to="/shares/new" className="btn btn-primary">
      Create New
    </DefeatableLink>
  )
}

const List: React.FC<ListProps> = ({
  active,
  items,
  shareNetworks,
  shareRules,
  searchTerm,
  isFetching,
  hasNext,
  loadSharesOnce,
  loadShareNetworksOnce,
  loadAvailabilityZonesOnce,
  loadShareRulesOnce,
  searchShares,
  handleDelete,
  handleForceDelete,
  reloadShare,
  loadNext,
}) => {
  useEffect(() => {
    if (!active) return
    loadSharesOnce()
    loadShareNetworksOnce()
    loadAvailabilityZonesOnce()
  }, [active, loadSharesOnce, loadShareNetworksOnce, loadAvailabilityZonesOnce])

  const getShareNetwork = (share: Share): ShareNetwork | null => {
    for (const network of shareNetworks.items) {
      if (network.id === share.share_network_id) return network
    }
    return null
  }

  const getShareRules = (share: Share): ShareRule | null => {
    const rules = shareRules[share.id]
    if (!rules) return null
    return rules
  }

  const filterShares = (): Share[] => {
    if (!searchTerm) return items

    // filter items
    return items.filter(
      (i) =>
        `${i.name} ${i.id} ${i.share_proto} ${i.status} ${i.export_locations?.join()}`.indexOf(searchTerm.trim()) >= 0
    )
  }

  const toolbar = () => {
    if (!policy.isAllowed("shared_filesystem_storage:share_create")) return null

    const { items: shareNetworkItems, isFetching: fetchingShareNetworks } = shareNetworks
    const hasShareNetworks = shareNetworkItems && shareNetworkItems.length > 0

    return (
      <div className="toolbar">
        {items.length > 0 && (
          <SearchField
            onChange={(term: string) => searchShares(term)}
            placeholder="name, ID, protocol or status"
            text="Searches by name, ID, protocol or status in visible shares list only.
                  Entering a search term will automatically start loading the next pages
                  and filter the loaded items using the search term. Emptying the search
                  input field will show all currently loaded items."
          />
        )}

        <div className="main-buttons">
          <CreateNewButton fetchingShareNetworks={fetchingShareNetworks} hasShareNetworks={hasShareNetworks} />
        </div>
      </div>
    )
  }

  const renderTable = () => {
    const filteredItems = filterShares()

    return (
      <div>
        <table className="table shares">
          <thead>
            <tr>
              <th>Name</th>
              <th>
                AZ
                <Tooltip placement="top" content="Availability Zone">
                  <i className="fa fa-fw fa-info-circle" />
                </Tooltip>
              </th>
              <th>Protocol</th>
              <th>Size</th>
              <th>Status</th>
              <th>Network</th>
              <th></th>
            </tr>
          </thead>
          <TransitionGroup component="tbody">
            {filteredItems && filteredItems.length > 0 ? (
              filteredItems.map(
                (share, index) =>
                  !share.isHidden && (
                    <TableRowFadeTransition key={share.id}>
                      <ShareItem
                        share={share}
                        shareNetwork={getShareNetwork(share)}
                        shareRules={getShareRules(share)}
                        handleDelete={handleDelete}
                        handleForceDelete={handleForceDelete}
                        reloadShare={reloadShare}
                        loadShareRulesOnce={loadShareRulesOnce}
                        policy={undefined}
                      />
                    </TableRowFadeTransition>
                  )
              )
            ) : (
              <TableRowFadeTransition key="empty">
                <tr>
                  <td colSpan={6}>{isFetching ? <span className="spinner" /> : "No Shares found."}</td>
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
