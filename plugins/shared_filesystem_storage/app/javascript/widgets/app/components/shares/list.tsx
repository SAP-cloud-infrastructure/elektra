import React, { useEffect } from "react"
import { DefeatableLink } from "lib/components/defeatable_link"
import { Popover, Tooltip } from "lib/components/Overlay"
import { TransitionGroup, CSSTransition } from "react-transition-group"
import { policy } from "lib/policy"
import { SearchField } from "lib/components/search_field"
import { AjaxPaginate } from "lib/components/ajax_paginate"
import ShareItem from "./item"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Share {
  id: string
  name?: string
  status: string
  isHidden?: boolean
  share_network_id?: string
  share_proto?: string
  export_locations?: string[]
  [key: string]: unknown
}

interface ShareNetworksState {
  isFetching: boolean
  items: Array<{ id: string; name?: string }>
}

interface ShareListProps {
  active: boolean
  isFetching: boolean
  items: Share[]
  shareNetworks: ShareNetworksState
  shareRules: Record<string, unknown>
  searchTerm?: string
  hasNext: boolean
  handleDelete: (id: string) => void
  handleForceDelete: (id: string) => void
  reloadShare: (id: string) => void
  loadShareRulesOnce: (id: string) => void
  loadSharesOnce: () => void
  loadShareNetworksOnce: () => void
  loadAvailabilityZonesOnce: () => void
  searchShares: (term: string) => void
  loadNext: () => void
}

// ─── TableRowFadeTransition ───────────────────────────────────────────────────

const TableRowFadeTransition: React.FC<{ children: React.ReactNode; [key: string]: unknown }> = ({
  children,
  ...props
}) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

// ─── CreateNewButton ──────────────────────────────────────────────────────────

const CreateNewButton: React.FC<{
  fetchingShareNetworks: boolean
  hasShareNetworks: boolean
}> = ({ fetchingShareNetworks, hasShareNetworks }) => {
  if (fetchingShareNetworks) {
    return (
      <Popover title="Loading Share Networks" content="Please wait..." placement="top">
        <button className="btn btn-primary disabled loading">Create New</button>
      </Popover>
    )
  }

  if (!hasShareNetworks) {
    return (
      <Popover
        title="No Share Network found"
        content="Please create a Share Network first."
        placement="top"
      >
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

// ─── Component ────────────────────────────────────────────────────────────────

const ShareList: React.FC<ShareListProps> = ({
  active,
  isFetching,
  items,
  shareNetworks,
  shareRules,
  searchTerm,
  hasNext,
  handleDelete,
  handleForceDelete,
  reloadShare,
  loadShareRulesOnce,
  loadSharesOnce,
  loadShareNetworksOnce,
  loadAvailabilityZonesOnce,
  searchShares,
  loadNext,
}) => {
  useEffect(() => {
    if (!active) return
    loadSharesOnce()
    loadShareNetworksOnce()
    loadAvailabilityZonesOnce()
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const shareNetwork = (share: Share) => {
    for (const network of shareNetworks.items) {
      if (network.id === share.share_network_id) return network
    }
    return null
  }

  const getShareRules = (share: Share) => {
    const rules = (shareRules as Record<string, unknown>)[share.id]
    return rules ?? null
  }

  const filterShares = () => {
    if (!searchTerm) return items
    return items.filter(
      (i) =>
        `${i.name} ${i.id} ${i.share_proto} ${i.status} ${i.export_locations?.join()}`.indexOf(
          searchTerm.trim()
        ) >= 0
    )
  }

  const renderToolbar = () => {
    if (!policy.isAllowed("shared_filesystem_storage:share_create")) return null

    const { items: shareNetworkItems, isFetching: fetchingShareNetworks } = shareNetworks
    const hasShareNetworks = shareNetworkItems && shareNetworkItems.length > 0

    return (
      <div className="toolbar">
        {items.length > 0 && (
          <SearchField
            onChange={(term: string) => searchShares(term)}
            placeholder="name, ID, protocol or status"
            text="Searches by name, ID, protocol or status in visible shares list only."
          />
        )}
        <div className="main-buttons">
          <CreateNewButton
            fetchingShareNetworks={fetchingShareNetworks}
            hasShareNetworks={hasShareNetworks}
          />
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
                (share) =>
                  !share.isHidden && (
                    <TableRowFadeTransition key={share.id}>
                      <ShareItem
                        share={share}
                        shareNetwork={shareNetwork(share)}
                        shareRules={getShareRules(share)}
                        handleDelete={handleDelete}
                        handleForceDelete={handleForceDelete}
                        reloadShare={reloadShare}
                        loadShareRulesOnce={loadShareRulesOnce}
                      />
                    </TableRowFadeTransition>
                  )
              )
            ) : (
              <TableRowFadeTransition>
                <tr>
                  <td colSpan={6}>
                    {isFetching ? <span className="spinner" /> : "No Shares found."}
                  </td>
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
      {!policy.isAllowed("shared_filesystem_storage:share_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        renderTable()
      )}
    </div>
  )
}

export default ShareList
