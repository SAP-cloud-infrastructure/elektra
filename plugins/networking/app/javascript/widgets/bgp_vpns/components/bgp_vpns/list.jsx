/* eslint-disable no-undef */
import { SearchField } from "lib/components/search_field"
import { Alert, MenuItem, Dropdown } from "react-bootstrap"
import { Link } from "react-router-dom"
import React, { useCallback } from "react"
import * as apiClient from "../../apiClient"
import { useGlobalState, useDispatch } from "../../stateProvider"
import { useHistory } from "react-router-dom"
import { confirm } from "lib/dialogs"

const BgpVpns = () => {
  const { bgpvpns, cachedProjects, cachedRouters } = useGlobalState()
  const cachedProjectsData = React.useMemo(
    () => cachedProjects.data || {},
    [cachedProjects.data]
  )
  const cachedRoutersData = React.useMemo(
    () => cachedRouters.data || {},
    [cachedRouters.data]
  )
  const dispatch = useDispatch()
  const [filter, setFilter] = React.useState()
  const history = useHistory()

  // load bgp vpns
  React.useEffect(() => {
    dispatch("bgpvpns", "request")
    apiClient
      .get("../../bgp-vpns")
      .then((data) => dispatch("bgpvpns", "receive", { items: data.bgpvpns }))
      .catch((error) => dispatch("bgpvpns", "error", { error: error.message }))
  }, [])

  // load objects from cache
  React.useEffect(() => {
    if (!bgpvpns.items) return

    const ids = bgpvpns.items.reduce(
      (list, i) => list.concat(i.routers, [i.project_id]),
      []
    )

    apiClient
      .get(`../../../../cache/objects-by-ids`, {
        ids,
      })
      .then((items) => {
        // group items by cache_type and i
        // result: {"project": {id: item}, "router": {id: item}}
        const data = items.reduce((map, i) => {
          map[i.cached_object_type] = map[i.cached_object_type] || {}
          map[i.cached_object_type][i.id] = i
          return map
        }, {})

        // set data to global state
        dispatch("cachedProjects", "receive", { data: data["project"] })
        dispatch("cachedRouters", "receive", { data: data["router"] })
      })
  }, [bgpvpns.items])

  const deleteBgpvpn = useCallback((id) => {
    confirm(`Do you really want to delete the BGP VPN ${id}?`)
      .then(() => {
        dispatch("bgpvpns", "patch", {
          name: "items",
          id,
          values: { isDeleting: true },
        })
        apiClient
          .del(`../../bgp-vpns/${id}`)
          .then(() => {
            dispatch("bgpvpns", "remove", { name: "items", id })
          })
          .catch((error) => {
            dispatch("bgpvpns", "error", { error: error.message })
            dispatch("bgpvpns", "patch", {
              name: "items",
              id,
              values: { isDeleting: false },
            })
          })
      })
      .catch((_aborted) => null)
  }, [])

  // filter items by name or id
  const filteredItems = React.useMemo(() => {
    if (!filter || filter.length === 0) return bgpvpns.items || []
    return bgpvpns.items.filter(
      (i) => i.name.indexOf(filter) >= 0 || i.id.indexOf(filter) >= 0
    )
  }, [bgpvpns.items, filter])

  return (
    <>
      <div className="toolbar">
        <SearchField
          onChange={(term) => setFilter(term)}
          placeholder="name or ID"
          text="Filters by name or ID"
        />

        <div className="main-buttons">
          {policy.isAllowed("networking:bgp_vpn_create") && (
            <Link to="/new" className="btn btn-primary">
              New BGP VPN
            </Link>
          )}
        </div>
      </div>
      {bgpvpns.error && <Alert bsStyle="danger">{bgpvpns.error}</Alert>}

      {!policy.isAllowed("networking:bgp_vpn_list") ? (
        <span>You are not allowed to see this page</span>
      ) : bgpvpns.isFetching ? (
        <span>
          <span className="spinner" />
          Loading...
        </span>
      ) : filteredItems.length === 0 ? (
        <span>No items found!</span>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Owning Project</th>
              <th>Associated Routers</th>
              <th>Shared</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, i) => (
              <tr key={i} className={item.isDeleting ? "updating" : ""}>
                <td>
                  <Link to={`/${item.id}`}>{item.name}</Link>
                  <br />
                  <span className="info-text">{item.id}</span>
                </td>
                <td>
                  {cachedProjectsData[item.project_id] ? (
                    <>
                    
                      <a
                        href={`/${item.domain_id}/${item.project_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {
                          cachedProjectsData[item.project_id].payload?.scope
                            ?.domain_name
                        }
                        /{cachedProjectsData[item.project_id].name}
                      </a>
                      <br />
                      <span className="info-text">{item.project_id}</span>
                    </>
                  ) : (
                    item.project_id
                  )}
                </td>
                <td>
                  {(item.routers || []).map((r, i) => (
                    <div key={i}>
                      {cachedRoutersData[r] ? (
                        <>
                          {cachedRoutersData[r].name}
                          <br />
                          <span className="info-text">{r}</span>
                        </>
                      ) : (
                        r
                      )}
                    </div>
                  ))}
                </td>
                <td>{`${item.shared}`}</td>
                <td>
                  {!item.isDeleting && (
                    <Dropdown id={`bgpvpns-dropdown-${item.id}`} pullRight>
                      <Dropdown.Toggle noCaret className="btn-sm">
                        <span className="fa fa-cog" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="super-colors">
                        <MenuItem onClick={() => history.push(`/${item.id}/2`)}>
                          Manage Routers
                        </MenuItem>
                        <MenuItem onClick={() => history.push(`/${item.id}/3`)}>
                          Access Control
                        </MenuItem>
                        {policy.isAllowed("networking:bgp_vpn_delete") && (
                          <>
                            <MenuItem divider />
                            <MenuItem onClick={() => deleteBgpvpn(item.id)}>
                              Delete
                            </MenuItem>
                          </>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default BgpVpns
