import React from "react"
import * as apiClient from "../../../apiClient"
import { useDispatch, useGlobalState } from "../../../stateProvider"
import { Alert } from "react-bootstrap"
import AddRouterAssociation from "./addRouterAssociation"
import AssociationItem from "./associationItem"
import reducer from "../../../defaultReducer"

/**
 * The bgp vpns contain an attribute "routers", which contains the IDs of associated routers.
 * In addition to the routers to which the user has access, this array can also contain
 * routers from other scopes (managed by admin).
 *
 * In this component we explicitly load the associations of current bgpvpn.
 * However, these associations only contain the routers accessible by the user.
 * So there can be a discrepancy between the "routers" array from the bgpvpn and the associations.
 *
 * In the UI we show the accessible routers as editable associations and the routers from
 * the external scope as non-editable ones.
 *
 * The enormous complicity arises when new associations are created or existing ones are removed.
 * In this case we not only have to manage the associations state, but also the "routers"
 * array directly on the bgpvpn.
 * @param {object} props, contains the selected bgpvpn (show)
 * @returns react component
 */
const BgpVpnRouters = ({ bgpvpn }) => {
  // routers in the elektra cache
  const cachedRoutersData = useGlobalState("cachedRouters").data || {}
  // routers from the api
  const availableRouters = useGlobalState("availableRouters")
  const bgpvpnRouterIDs = React.useMemo(() => bgpvpn.routers || [])
  const globalDispatch = useDispatch()
  // router id
  const [routerID, setRouterID] = React.useState()
  const [isAdding, setIsAdding] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState({})
  // controls the inline "Add Router" form (mirrors the Manage Subnets UX:
  // a "+ Add Router" button that reveals an inline select + Add/Cancel row)
  const [showForm, setShowForm] = React.useState(false)

  const isMounted = React.useRef(false)

  const bgpvpnRouters = React.useRef(bgpvpn?.routers)

  React.useEffect(() => {
    isMounted.current = true // Will set it to true on mount ...
    return () => {
      isMounted.current = false
    } // ... and to false on unmount
  }, [])

  // local state of associations
  const [associations, associationDispatch] = React.useReducer(reducer, reducer({ items: [] }))

  const url = React.useMemo(() => `../../bgp-vpns/${bgpvpn.id}/router-associations`, [bgpvpn])

  // delete router association
  const deleteAssociation = React.useCallback(
    (id) => {
      associationDispatch({ type: "resetError" })
      setIsDeleting((state) => ({ ...state, [id]: true }))

      apiClient
        .del(`${url}/${id}`)
        .then(() => {
          if (!associations.items) return
          const association = associations.items.find((i) => i.id === id)
          if (isMounted.current) associationDispatch({ type: "remove", name: "items", id })
          return association
        })
        .then((association) => {
          // remove from the "routers" array of the current bgp vpn
          if (!association?.router_id || !bgpvpnRouters.current) return
          const item = { ...bgpvpn }
          item.routers = bgpvpnRouters.current.slice().filter((id) => id !== association.router_id)
          bgpvpnRouters.current = item.routers
          globalDispatch("bgpvpns", "update", { name: "items", item })
        })
        .then(() => isMounted.current && setIsDeleting((state) => ({ ...state, [id]: false })))
        .catch((error) => isMounted.current && associationDispatch({ type: "error", error }))
    },
    [url, associations, associationDispatch, bgpvpn]
  )

  // create router association
  const addAssociation = React.useCallback(() => {
    setIsAdding(true)
    associationDispatch({ type: "resetError" })
    apiClient
      .post(`${url}`, { router_id: routerID })
      .then((data) => {
        // add to the current
        if (isMounted.current)
          associationDispatch({
            type: "add",
            name: "items",
            item: data.router_association,
          })
      })
      .then(() => {
        // add router_id to the "routers" array of the current bgp vpn
        if (!bgpvpn || !bgpvpnRouters.current) return
        const item = { ...bgpvpn }
        const index = item.routers.indexOf(routerID)
        // ignore if already in the list
        if (index >= 0) return
        item.routers = bgpvpnRouters.current.slice()
        item.routers.push(routerID)
        bgpvpnRouters.current = item.routers
        globalDispatch("bgpvpns", "update", { name: "items", item })
        setRouterID(null)
      })
      .then(() => {
        // close the inline form after a successful add
        if (isMounted.current) setShowForm(false)
      })
      .catch((error) => isMounted.current && associationDispatch({ type: "error", error }))
      .finally(() => isMounted.current && setIsAdding(false))
  }, [url, bgpvpn, associationDispatch, routerID])

  // close and reset the inline add form
  const cancelForm = React.useCallback(() => {
    setShowForm(false)
    setRouterID(null)
  }, [])

  // load bgp vpn router associations
  React.useEffect(() => {
    associationDispatch({ type: "request" })
    apiClient
      .get(url)
      .then((data) => {
        if (isMounted.current)
          associationDispatch({
            type: "receive",
            items: data.router_associations,
          })
      })
      .catch((error) => isMounted.current && associationDispatch({ type: "error", error }))
  }, [associationDispatch])

  // Load the router objects (name + scope) from the elektra cache for this
  // bgpvpn's routers. The parent list normally populates `cachedRouters`, but
  // when the Show modal is opened directly (deep link / reload) that state can
  // be empty, which made the Routers tab fall back to showing the raw ID only.
  React.useEffect(() => {
    if (!bgpvpnRouterIDs || bgpvpnRouterIDs.length === 0) return
    // skip IDs already present in the cache
    const missing = bgpvpnRouterIDs.filter((id) => !cachedRoutersData[id])
    if (missing.length === 0) return

    apiClient
      .get(`../../../../cache/objects-by-ids`, { ids: bgpvpnRouterIDs })
      .then((items) => {
        const routers = items.reduce((map, i) => {
          if (i.cached_object_type === "router") map[i.id] = i
          return map
        }, {})
        if (isMounted.current && Object.keys(routers).length > 0)
          // merge with any already-cached routers (the reducer replaces `data`)
          globalDispatch("cachedRouters", "receive", {
            data: { ...cachedRoutersData, ...routers },
          })
      })
      .catch(() => null)
  }, [bgpvpnRouterIDs])

  // load available routers (for selectbox)
  // available routers are also used for subnet infos
  React.useEffect(() => {
    // return if already loaded
    if (availableRouters.isFetching) return

    // check if associations haave routers which are not in avialableRouters state
    // if so then reload availableRouters
    if (availableRouters.data && associations.items) {
      const routerIDs = Object.keys(availableRouters.data)
      const available = associations.items.every((a) => routerIDs.indexOf(a.router_id) >= 0)
      if (available) return
    }

    if (!associations.items) return

    globalDispatch("availableRouters", "request")
    apiClient
      .get(`../../bgp-vpns/routers`)
      .then((data) => {
        const routersByID = data.routers.reduce((map, r) => {
          map[r.id] = r
          return map
        }, {})
        globalDispatch("availableRouters", "receive", { data: routersByID })
      })
      .catch((error) =>
        globalDispatch("availableRouters", "receive", {
          error,
        })
      )
  }, [availableRouters, associations.items])

  const foreignRouterIDs = React.useMemo(() => {
    if (!associations.items) return []
    const ids = associations.items.map((i) => i.router_id)
    return bgpvpnRouterIDs.filter((id) => ids.indexOf(id) < 0)
  }, [associations.items, bgpvpnRouterIDs])

  const availableAssociationRouters = React.useMemo(() => {
    if (!availableRouters.data || !associations.items) return []
    return Object.values(availableRouters.data).filter(
      (router) => associations.items.findIndex((i) => i.router_id === router.id) < 0
    )
  }, [availableRouters.data, associations.items])

  if (associations.isFetching || availableRouters.isFetching)
    return (
      <span>
        <span className="spinner" />
        Loading...
      </span>
    )

  return (
    <>
      {associations.error && <Alert variant="danger">{associations.error.toString()}</Alert>}

      {/* Add-router control, same UX as the Manage Subnets dialog: a
          "+ Add Router" button that toggles an inline select + Add/Cancel row. */}
      {availableRouters.data && (
        <div className="toolbar toolbar-controlcenter">
          {showForm ? (
            <form
              className="form-inline"
              onSubmit={(e) => {
                e.preventDefault()
                if (routerID && !isAdding) addAssociation()
              }}
            >
              <div className="form-group">
                <AddRouterAssociation
                  routerID={routerID}
                  disabled={isAdding}
                  routers={availableAssociationRouters}
                  onSelect={(routerID) => setRouterID(routerID)}
                />
              </div>
              <div className="form-group form-actions">
                <button
                  type="submit"
                  disabled={!routerID || isAdding}
                  className={`btn btn-primary ${isAdding ? "loading" : ""}`}
                >
                  Add
                </button>
                <button type="button" className="btn btn-secondary" disabled={isAdding} onClick={() => cancelForm()}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="main-control-buttons">
              <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                <i className="fa fa-plus" /> Add Router
              </button>
            </div>
          )}
        </div>
      )}

      {/* normal user has no access to shared associations. For this case we
        consider the routers field of bgpvpn (with canEdit = false). When there
        is nothing to show, render just the message instead of an empty table. */}
      {associations.items.length === 0 && foreignRouterIDs.length === 0 ? (
        <p>No router associations found!</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name/ID</th>
              <th width="45%">Subnets</th>
              <th className="snug"></th>
            </tr>
          </thead>
          <tbody>
            {associations.items.map((association, i) => (
              <AssociationItem
                key={i}
                isDeleting={isDeleting[association.id]}
                onDelete={() => deleteAssociation(association.id)}
                routerId={association.router_id}
                cachedData={cachedRoutersData[association.router_id]}
                router={availableRouters.data && availableRouters.data[association.router_id]}
                isFetching={availableRouters.isFetching}
              />
            ))}
            {foreignRouterIDs.map((routerId, i) => (
              <AssociationItem key={i} routerId={routerId} cachedData={cachedRoutersData[routerId]} />
            ))}
          </tbody>
        </table>
      )}
      {/* <pre>{JSON.stringify(routersDeepData, null, 2)}</pre> */}
    </>
  )
}

export default BgpVpnRouters
