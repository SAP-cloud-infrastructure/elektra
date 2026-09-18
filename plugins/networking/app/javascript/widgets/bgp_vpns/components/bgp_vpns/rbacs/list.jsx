/* eslint-disable no-undef */
import React from "react"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { AutocompleteField } from "lib/components/autocomplete_field"
import Item from "./item"
import * as apiClient from "../../../apiClient"
import reducer from "../../../defaultReducer"

const RBACs = ({ bgpvpn }) => {
  const [rbacs, dispatch] = React.useReducer(reducer, { items: [] })
  const [isCreating, setIsCreating] = React.useState(false)
  const [newItem, setNewItem] = React.useState()
  const [cachedProjects, setCachedProjects] = React.useState({})
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

    apiClient
      .get(`../../cache/objects-by-ids?ids=${projectIDs.join(",")}`)
      .then((items) => {
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
      .catch(
        (error) =>
          isMounted.current && dispatch({ type: "error", error: error.message })
      )
  }, [url])

  // Create rbac
  const add = React.useCallback(() => {
    setIsCreating(true)
    dispatch({ type: "resetError" })
    apiClient
      .post(`${url}`, { target_tenant: newItem })
      .then(
        (item) =>
          isMounted.current && dispatch({ type: "add", name: "items", item })
      )
      .then(() => setNewItem(""))
      .catch(
        (error) =>
          isMounted.current && dispatch({ type: "error", error: error.message })
      )
      .finally(() => isMounted.current && setIsCreating(false))
  }, [newItem])

  // Delete rbac
  const remove = React.useCallback((id) => {
    dispatch({ type: "resetError" })
    dispatch({ type: "patch", name: "items", id, values: { isDeleting: true } })
    apiClient
      .del(`${url}/${id}`)
      .then(() => {
        if (isMounted.current) dispatch({ type: "remove", name: "items", id })
      })
      .catch(
        (error) =>
          isMounted.current && dispatch({ type: "error", error: error.message })
      )
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
        <Alert bsStyle="danger">
          {typeof rbacs.error === "string"
            ? rbacs.error
            : Object.keys(rbacs.error).map((key, i) => (
                <div key={i}>
                  {key}: {rbacs.error[key]}
                </div>
              ))}
        </Alert>
      )}
      {rbacs.isFetching ? (
        <span>
          <span className="spinner" />
          Loading...
        </span>
      ) : rbacs.items.length === 0 ? (
        <span>No items found!</span>
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
                canDelete={policy.isAllowed(
                  "networking:bgp_vpn_rbac_policy_delete",
                  {
                    bgp_vpn: bgpvpn,
                  }
                )}
              />
            ))}
          </tbody>
        </table>
      )}

      {policy.isAllowed("networking:bgp_vpn_rbac_policy_create", {
        bgp_vpn: bgpvpn,
      }) && (
        <table className="table">
          <tbody>
            <tr>
              <td></td>
              <td width="45%">
                <AutocompleteField
                  type="projects"
                  disabled={isCreating}
                  onSelected={(list) => {
                    const id = list[0]?.id
                    if (id) setNewItem(id)
                  }}
                  onInputChange={(id) => setNewItem(id)}
                />
              </td>
              <td className="snug">
                <button
                  disabled={isCreating}
                  type="button"
                  className={`btn btn-primary ${isCreating ? "loading" : ""}`}
                  onClick={add}
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  )
}

export default RBACs
