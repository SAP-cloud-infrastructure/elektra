import React from "react"
import { Link } from "react-router-dom"
import { policy } from "lib/policy"
import { SearchField } from "lib/components/search_field"
import EntryItem from "./item"
import apiClient from "../../apiClient"
import { useGlobalState } from "../StateProvider"

import {
  Button,
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
  DataGridToolbar,
  Spinner,
} from "@cloudoperators/juno-ui-components"

const Entries = () => {
  const [filterTerm, setFilterTerm] = React.useState(null)
  const [{ entries: entriesState }, dispatch] = useGlobalState()
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

  React.useEffect(() => {
    if (entriesState.loaded || entriesState.isFetching) return

    dispatch({ type: "@entries/request" })
    apiClient
      .get("kubernetes_ng-api/entries")
      .then((response) => response.data)
      .then(
        (items) =>
          mounted.current && dispatch({ type: "@entries/receive", items })
      )
      .catch(
        (error) =>
          mounted.current &&
          dispatch({ type: "@entries/error", error: error.message })
      )
  }, [dispatch, entriesState])

  const handleDelete = React.useCallback(
    (id) => {
      dispatch({ type: "@entries/requestDelete", id })
      apiClient
        .delete(`kubernetes_ng-api/entries/${id}`)
        .then(
          () => mounted.current && dispatch({ type: "@entries/delete", id })
        )
        .catch(
          (error) =>
            mounted.current &&
            dispatch({
              type: "@entries/deleteFailure",
              id,
              error: error.message,
            })
        )
    },
    [dispatch]
  )

  const filteredItems = React.useMemo(() => {
    if (!entriesState.items || entriesState.items.length === 0) return []
    if (!filterTerm || filterTerm === "") return entriesState.items
    return entriesState.items.filter(
      (item) =>
        (item.name && item.name.indexOf(filterTerm) >= 0) ||
        (item.description && item.description.indexOf(filterTerm) >= 0)
    )
  }, [entriesState.items, filterTerm])

  return (
    <>
      <DataGridToolbar
        search={
          <SearchField
            variant="juno"
            onChange={setFilterTerm}
            placeholder="name or description"
            text="Searches by name or description in visible entries list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
          />
        }
      >
        {policy.isAllowed("kubernetes_ng:entry_create") && (
          <Link to="/entries/new">
            <Button>Create new</Button>
          </Link>
        )}
      </DataGridToolbar>

      {!policy.isAllowed("kubernetes_ng:entry_list") ? (
        <span>You are not allowed to see this page</span>
      ) : entriesState.isFetching ? (
        <Spinner variant="primary" />
      ) : (
        <DataGrid columns={3} minContentColumns={[2]}>
          <DataGridRow>
            <DataGridHeadCell>Name</DataGridHeadCell>
            <DataGridHeadCell>Description</DataGridHeadCell>
            <DataGridHeadCell></DataGridHeadCell>
          </DataGridRow>
          {filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((entry, index) => (
              <EntryItem
                key={index}
                entry={entry}
                handleDelete={handleDelete}
              />
            ))
          ) : (
            <DataGridRow>
              <DataGridCell colSpan={3}>No Entries found.</DataGridCell>
            </DataGridRow>
          )}
        </DataGrid>
      )}
    </>
  )
}

export default Entries
