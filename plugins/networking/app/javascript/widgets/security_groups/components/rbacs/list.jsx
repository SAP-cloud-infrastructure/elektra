/* eslint-disable no-undef */
import React from "react"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useParams, useHistory } from "react-router-dom"
import { pluginAjaxHelper } from "lib/ajax_helper"
import { AutocompleteField } from "lib/components/autocomplete_field"
import Item from "./item"
const ajaxHelper = pluginAjaxHelper("networking")

const initialState = { items: [] }

function reducer(state, action) {
  switch (action.type) {
    case "request":
      return { ...state, isFetching: true, error: null }
    case "receive":
      return { ...state, isFetching: false, items: action.items }
    case "add": {
      const items = state.items.slice()
      const index = items.findIndex((i) => i.id === action.item.id)
      if (index >= 0) items[index] = action.item
      else items.unshift(action.item)
      return { ...state, items }
    }
    case "request_remove": {
      const index = state.items.findIndex((i) => i.id === action.id)
      if (index < 0) return state
      const items = state.items.slice()
      items[index] = { ...items[index], isDeleting: true }
      return { ...state, items }
    }
    case "remove": {
      const index = state.items.findIndex((i) => i.id === action.id)
      if (index < 0) return state
      const items = state.items.slice()
      items.splice(index, 1)
      return { ...state, items }
    }
    case "remove_failure": {
      const index = state.items.findIndex((i) => i.id === action.id)
      if (index < 0) return state
      const items = state.items.slice()
      items[index] = { ...items[index], isDeleting: false }
      return { ...state, items, error: action.error }
    }
    case "error":
      return { ...state, error: action.error }
    case "reset_error":
      return { ...state, error: null }
    default:
      throw new Error()
  }
}

const RBACs = ({ securityGroup }) => {
  const { securityGroupId } = useParams()
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const [show, setShow] = React.useState(!!securityGroupId)
  const [newItem, setNewItem] = React.useState()
  const [isCreating, setIsCreating] = React.useState(false)
  const [cachedProjects, setCachedProjects] = React.useState({})

  const history = useHistory()

  React.useEffect(() => {
    if (!state.items || state.items.length === 0) return

    const projectIDs = state.items
      .map((i) => i.target_tenant)
      .filter((value, index, self) => self.indexOf(value) === index)

    ajaxHelper
      .get(`cache/objects-by-ids?ids=${projectIDs.join(",")}`)
      .then((response) => {
        const items = response.data
        const itemsById = items.reduce((map, i) => {
          map[i.id] = i
          return map
        }, {})
        setCachedProjects(itemsById)
      })
  }, [state.items])

  React.useEffect(() => {
    if (!securityGroupId) return
    dispatch({ type: "request" })
    ajaxHelper
      .get(`security-groups/${securityGroupId}/rbacs`)
      .then((response) => {
        dispatch({ type: "receive", items: response.data })
      })
      .catch((error) => {
        const message = error?.response?.data?.errors || error?.message
        dispatch({ type: "error", error: message })
      })
  }, [securityGroupId])

  // This function adds a new project (newItem) to the access control.
  // The user either selected the new project from the autocompletion
  // or entered the ID directly.
  const add = React.useCallback(() => {
    // mark as creating
    setIsCreating(true)
    // reset state
    dispatch({ type: "reset_error" })

    // start promise chain
    // using Promise here allows us to do the error processing once
    // at the end of the chain
    new Promise((resolve, reject) => {
      if (newItem.id) resolve(true)
      // no id provided -> throw error
      else reject("No project ID provided")
    })
      .then(() => {
        if (!newItem.name) {
          // no name exists -> make a live search to check if this project exists
          return ajaxHelper
            .get(`cache/live_search?type=project&term=${newItem.id}`)
            .then((response) => {
              // trow error if no items found
              if (!response?.data?.items || response.data.items.length === 0)
                throw `No project found with ID ${newItem.id}`
            })
        }
      })
      .then(() =>
        ajaxHelper
          .post(`security-groups/${securityGroupId}/rbacs`, {
            target_tenant: newItem.id,
          })
          .then((response) => {
            dispatch({ type: "add", item: response.data })
          })
      )
      .catch((error) => {
        // process errors
        const message = error?.response?.data?.errors || error.message || error
        dispatch({ type: "error", error: message })
      })
      .finally(() => {
        //cleanup
        setIsCreating(false)
        setNewItem(null)
      })
    //----------------------------
  }, [newItem])

  const remove = React.useCallback((id) => {
    dispatch({ type: "request_remove", id })
    ajaxHelper
      .delete(`security-groups/${securityGroupId}/rbacs/${id}`)
      .then((response) => {
        dispatch({ type: "remove", id })
      })
      .catch((error) => {
        const message = error.data?.errors || error.message
        dispatch({ type: "remove_failure", id, error: message })
      })
  }, [])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/")
  }, [])

  return (
    <Modal
      show={show}
      onHide={close}
      onExited={back}
      bsSize="large"
      backdrop="static"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Access Control for {securityGroup?.name || securityGroupId}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {state.error && (
          <Alert bsStyle="danger">
            {typeof state.error === "string"
              ? state.error
              : Object.keys(state.error).map((key, i) => (
                  <div key={i}>
                    {key}: {state.error[key]}
                  </div>
                ))}
          </Alert>
        )}
        {state.isFetching ? (
          <span>
            <span className="spinner" />
            Loading...
          </span>
        ) : state.items.length === 0 ? (
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
              {state.items.map((item, i) => (
                <Item
                  key={i}
                  item={item}
                  cachedProject={cachedProjects[item.target_tenant]}
                  onDelete={remove}
                  canDelete={policy.isAllowed(
                    "networking:security_groups_rbac_policy_delete",
                    {
                      security_group: securityGroup,
                    }
                  )}
                />
              ))}
            </tbody>
          </table>
        )}

        {policy.isAllowed("networking:security_groups_rbac_policy_create", {
          security_group: securityGroup,
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
                      setNewItem({ id, name: list[0]?.name })
                    }}
                    onInputChange={(id) => {
                      setNewItem({ id })
                    }}
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
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default RBACs
