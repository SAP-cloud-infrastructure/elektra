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

  const isMounted = React.useRef(false)

  const bgpvpnRouters = React.useRef(bgpvpn?.routers)

  React.useEffect(() => {
    isMounted.current = true // Will set it to true on mount ...
    return () => {
      isMounted.current = false
    } // ... and to false on unmount
  }, [])

  // local state of associations
  const [associations, associationDispatch] = React.useReducer(
    reducer,
    reducer({ items: [] })
  )

  const url = React.useMemo(
    () => `../../bgp-vpns/${bgpvpn.id}/router-associations`,
    [bgpvpn]
  )

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
          if (isMounted.current)
            associationDispatch({ type: "remove", name: "items", id })
          return association
        })
        .then((association) => {
          // remove from the "routers" array of the current bgp vpn
          if (!association?.router_id || !bgpvpnRouters.current) return
          const item = { ...bgpvpn }
          item.routers = bgpvpnRouters.current
            .slice()
            .filter((id) => id !== association.router_id)
          bgpvpnRouters.current = item.routers
          globalDispatch("bgpvpns", "update", { name: "items", item })
        })
        .then(
          () =>
            isMounted.current &&
            setIsDeleting((state) => ({ ...state, [id]: false }))
        )
        .catch(
          (error) =>
            isMounted.current &&
            associationDispatch({ type: "error", error: error })
        )
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
      .catch(
        (error) =>
          isMounted.current && associationDispatch({ type: "error", error })
      )
      .finally(() => isMounted.current && setIsAdding(false))
  }, [url, bgpvpn, associationDispatch, routerID])

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
      .catch(
        (error) =>
          isMounted.current && associationDispatch({ type: "error", error })
      )
  }, [associationDispatch])

  // load available routers (for selectbox)
  // available routers are also used for subnet infos
  React.useEffect(() => {
    // return if already loaded
    if (availableRouters.isFetching) return

    // check if associations haave routers which are not in avialableRouters state
    // if so then reload availableRouters
    if (availableRouters.data && associations.items) {
      const routerIDs = Object.keys(availableRouters.data)
      const available = associations.items.every(
        (a) => routerIDs.indexOf(a.router_id) >= 0
      )
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
      (router) =>
        associations.items.findIndex((i) => i.router_id === router.id) < 0
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
      {associations.error && (
        <Alert variant="danger">{associations.error.toString()}</Alert>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name/ID</th>
            <th width="45%">Subnets</th>
            <th className="snug"></th>
          </tr>
        </thead>
        <tbody>
          {/* normal user has no access to shared associations. For
            this case we consider the routers field of bgpvpn (with canEdit = false).
          */}
          {associations.items.length === 0 && foreignRouterIDs.length === 0 ? (
            <tr>
              <td colSpan="3">
                <span>No router associations found!</span>
              </td>
            </tr>
          ) : (
            <>
              {associations.items.map((association, i) => (
                <AssociationItem
                  key={i}
                  isDeleting={isDeleting[association.id]}
                  onDelete={() => deleteAssociation(association.id)}
                  routerId={association.router_id}
                  cachedData={cachedRoutersData[association.router_id]}
                  router={
                    availableRouters.data &&
                    availableRouters.data[association.router_id]
                  }
                  isFetching={availableRouters.isFetching}
                />
              ))}
              {foreignRouterIDs.map((routerId, i) => (
                <AssociationItem
                  key={i}
                  routerId={routerId}
                  cachedData={cachedRoutersData[routerId]}
                />
              ))}
            </>
          )}
        </tbody>
      </table>

      <table className="table">
        <tbody>
          <tr>
            <td></td>
            <td width="45%">
              <div className="pull-right">
                {availableRouters.data && (
                  <AddRouterAssociation
                    routerID={routerID}
                    disabled={isAdding}
                    routers={availableAssociationRouters}
                    onSelect={(routerID) => setRouterID(routerID)}
                  />
                )}
              </div>
            </td>
            <td className="snug">
              <button
                disabled={!routerID || isAdding}
                onClick={() => addAssociation()}
                className={`btn btn-primary btn-sm ${
                  isAdding ? "loading" : ""
                }`}
              >
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {/* <pre>{JSON.stringify(routersDeepData, null, 2)}</pre> */}
    </>
  )
}

export default BgpVpnRouters
