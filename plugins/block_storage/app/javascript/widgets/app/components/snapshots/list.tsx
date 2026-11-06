import React, { useEffect, useMemo, useState } from "react"

// @ts-expect-error no types
import { Form } from "lib/components/searchComponents"
import Item from "./item"
// @ts-expect-error no types
import { AjaxPaginate } from "lib/components/ajax_paginate"


interface Snapshot {
  id: string
  name: string
  description: string
  volume_id: string
  size: number
  status: string
  created_at?: string
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

  // The field the user picked in the search dropdown. When unset we fall back
  // to matching across all fields (same as before the Form migration).
  const [searchType, setSearchType] = useState<string | null>(null)

  const filterItems = useMemo(() => {
    const { items = [], searchTerm } = snapshots
    if (!searchTerm) return items

    // filter items using case-insensitive string matching
    const lowerSearch = searchTerm.trim().toLowerCase()
    return items.filter((i) => {
      // When a specific field is selected, match only that field; otherwise
      // match across all searchable fields.
      const haystack =
        searchType && searchType in i
          ? `${(i as unknown as Record<string, unknown>)[searchType] ?? ""}`
          : `${i.id} ${i.name} ${i.description} ${i.volume_id} ${i.size} ${i.status}`
      return haystack.toLowerCase().includes(lowerSearch)
    })
  }, [snapshots, searchType])

  const { hasNext, isFetching, searchTerm, items } = snapshots
  const filteredItems = filterItems

  return (
    <>
      {items.length > 5 && (
        <div className="toolbar toolbar-controlcenter">
          <Form
            isLoading={isFetching}
            searchFor={["name", "description", "id", "status"]}
            onSubmit={(type: string | null, term: string | null) => {
              setSearchType(type)
              search(term || "")
            }}
            helpText="Searches by name, description, ID or status in the visible snapshots list only.
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
            <th>Status</th>
            <th>Size(GB)</th>
            <th>Source Volume</th>
            <th style={{ whiteSpace: "nowrap" }}>Created At</th>
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
