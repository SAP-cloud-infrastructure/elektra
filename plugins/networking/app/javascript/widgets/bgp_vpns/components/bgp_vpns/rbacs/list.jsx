/* eslint-disable no-undef */
import React from "react"
import { Alert } from "react-bootstrap"
import { AutocompleteField } from "lib/components/autocomplete_field"
import Item from "./item"
import * as apiClient from "../../../apiClient"
import reducer from "../../../defaultReducer"

const RBACs = ({ bgpvpn }) => {
  const [rbacs, dispatch] = React.useReducer(reducer, { items: [] })
  const [isCreating, setIsCreating] = React.useState(false)
  const [newItem, setNewItem] = React.useState()
  const [cachedProjects, setCachedProjects] = React.useState({})
  // controls the inline "Add Access" form (same UX as the Networks Access
  // Control dialog: a "+ Add Access" button reveals an inline field + actions)
  const [showForm, setShowForm] = React.useState(false)
  const isMounted = React.useRef(false)
  const url = React.useMemo(() => `../../bgp-vpns/${bgpvpn.id}/rbacs`, [bgpvpn])

  React.useEffect(() => {
    isMounted.current = true // Will set it to true on mount ...
    return () => {
      isMounted.current = false
    } // ... and to false on unmount
  }, [])

  React.useEffect(() => {
    if (!rbacs.items || rbacs.items.length === 0) return

    const projectIDs = rbacs.items
      .map((i) => i.target_tenant)
      .filter((value, index, self) => self.indexOf(value) === index)

    apiClient.get(`../../cache/objects-by-ids?ids=${projectIDs.join(",")}`).then((items) => {
      items = items || []
      const itemsById = items.reduce((map, i) => {
        map[i.id] = i
        return map
      }, {})
      setCachedProjects(itemsById)
    })
  }, [rbacs.items])

  // Load rbacs
  React.useEffect(() => {
    if (!url) return
    dispatch({ type: "request" })
    apiClient
      .get(url)
      .then((items) => {
        if (isMounted.current) dispatch({ type: "receive", items })
      })
      .catch((error) => isMounted.current && dispatch({ type: "error", error: error.message }))
  }, [url])

  // Create rbac
  const add = React.useCallback(() => {
    setIsCreating(true)
    dispatch({ type: "resetError" })
    apiClient
      .post(`${url}`, { target_tenant: newItem })
      .then((item) => isMounted.current && dispatch({ type: "add", name: "items", item }))
      .then(() => {
        setNewItem("")
        if (isMounted.current) setShowForm(false)
      })
      .catch((error) => isMounted.current && dispatch({ type: "error", error: error.message }))
      .finally(() => isMounted.current && setIsCreating(false))
  }, [newItem])

  // close and reset the inline add form
  const cancelForm = React.useCallback(() => {
    setShowForm(false)
    setNewItem("")
  }, [])

  // Delete rbac
  const remove = React.useCallback((id) => {
    dispatch({ type: "resetError" })
    dispatch({ type: "patch", name: "items", id, values: { isDeleting: true } })
    apiClient
      .del(`${url}/${id}`)
      .then(() => {
        if (isMounted.current) dispatch({ type: "remove", name: "items", id })
      })
      .catch((error) => isMounted.current && dispatch({ type: "error", error: error.message }))
      .finally(() =>
        dispatch({
          type: "patch",
          name: "items",
          id,
          values: { isDeleting: false },
        })
      )
  }, [])

  return (
    <>
      {rbacs.error && (
        <Alert variant="danger">
          {typeof rbacs.error === "string"
            ? rbacs.error
            : Object.keys(rbacs.error).map((key, i) => (
                <div key={i}>
                  {key}: {rbacs.error[key]}
                </div>
              ))}
        </Alert>
      )}

      {/* Add-access control, same UX as the Networks Access Control dialog:
          a "+ Add Access" button that toggles an inline field + Add/Cancel row. */}
      {policy.isAllowed("networking:bgp_vpn_rbac_policy_create", {
        bgp_vpn: bgpvpn,
      }) && (
        <div className="toolbar toolbar-controlcenter">
          {showForm ? (
            <form
              className="form-inline"
              onSubmit={(e) => {
                e.preventDefault()
                if (newItem && !isCreating) add()
              }}
            >
              <div className="form-group">
                <AutocompleteField
                  type="projects"
                  disabled={isCreating}
                  onSelected={(list) => {
                    const id = list[0]?.id
                    if (id) setNewItem(id)
                  }}
                  onInputChange={(id) => setNewItem(id)}
                />
              </div>
              <div className="form-group form-actions">
                <button
                  type="submit"
                  disabled={!newItem || isCreating}
                  className={`btn btn-primary ${isCreating ? "loading" : ""}`}
                >
                  Add
                </button>
                <button type="button" className="btn btn-secondary" disabled={isCreating} onClick={() => cancelForm()}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="main-control-buttons">
              <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                <i className="fa fa-plus" /> Add Access
              </button>
            </div>
          )}
        </div>
      )}

      {rbacs.isFetching ? (
        <span>
          <span className="spinner" />
          Loading...
        </span>
      ) : rbacs.items.length === 0 ? (
        <p>No items found!</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Policy</th>
              <th width="45%">Target Project</th>
              <th className="snug"></th>
            </tr>
          </thead>
          <tbody>
            {rbacs.items.map((item, i) => (
              <Item
                key={i}
                item={item}
                cachedProject={cachedProjects[item.target_tenant]}
                onDelete={remove}
                canDelete={policy.isAllowed("networking:bgp_vpn_rbac_policy_delete", {
                  bgp_vpn: bgpvpn,
                })}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default RBACs
