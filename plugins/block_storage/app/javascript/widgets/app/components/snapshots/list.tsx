import React, { useEffect, useMemo } from "react"
import { CSSTransition } from "react-transition-group"
import { SearchField } from "lib/components/search_field"
import Item from "./item"
import { AjaxPaginate } from "lib/components/ajax_paginate"

const TableRowFadeTransition = ({ children, ...props }: any) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

interface Snapshot {
  id: string
  name: string
  description: string
  volume_id: string
  size: number
  status: string
}

interface SnapshotsState {
  items: Snapshot[]
  searchTerm: string
  hasNext: boolean
  isFetching: boolean
}

interface ListProps {
  active: boolean
  snapshots: SnapshotsState
  loadSnapshotsOnce: () => void
  search: (term: string) => void
  loadNext: () => void
  reloadSnapshot: (id: string) => void
  deleteSnapshot: (id: string) => void
}

const List: React.FC<ListProps> = ({
  active,
  snapshots,
  loadSnapshotsOnce,
  search,
  loadNext,
  reloadSnapshot,
  deleteSnapshot,
}) => {
  useEffect(() => {
    if (!active) return
    loadSnapshotsOnce()
  }, [active, loadSnapshotsOnce])

  const filterItems = useMemo(() => {
    const { items = [], searchTerm } = snapshots
    if (!searchTerm) return items
    
    // filter items using case-insensitive string matching
    const lowerSearch = searchTerm.trim().toLowerCase()
    return items.filter((i) => {
      const searchableText = `${i.id} ${i.name} ${i.description} ${i.volume_id} ${i.size} ${i.status}`.toLowerCase()
      return searchableText.includes(lowerSearch)
    })
  }, [snapshots])

  const { hasNext, isFetching, searchTerm, items } = snapshots
  const filteredItems = filterItems

  return (
    <>
      {items.length > 5 && (
        <div className="toolbar">
          <SearchField
            onChange={(term) => search(term)}
            placeholder="name, ID, format or status"
            text="Searches by name, ID, format or status in visible snapshots list only.
              Entering a search term will automatically start loading the next pages
              and filter the loaded items using the search term. Emptying the search
              input field will show all currently loaded items."
          />
        </div>
      )}
      <table className="table snapshots">
        <thead>
          <tr>
            <th>Snapshot</th>
            <th>Description</th>
            <th>Size(GB)</th>
            <th>Source Volume</th>
            <th>Status</th>
            <th className="snug"></th>
          </tr>
        </thead>
        <tbody>
          {filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((snapshot, index) => (
              <Item
                snapshot={snapshot}
                key={snapshot.id || index}
                searchTerm={searchTerm}
                reloadSnapshot={reloadSnapshot}
                deleteSnapshot={deleteSnapshot}
              />
            ))
          ) : (
            <tr>
              <td colSpan={6}>
                {isFetching ? <span className="spinner" data-testid="spinner" /> : "No snapshots found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <AjaxPaginate
        hasNext={hasNext}
        isFetching={isFetching}
        onLoadNext={loadNext}
        text={undefined}
        onLoadAll={undefined}
      />
    </>
  )
}

export default List
