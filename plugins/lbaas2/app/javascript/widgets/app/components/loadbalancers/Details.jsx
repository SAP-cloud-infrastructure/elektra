import React, { useState, useEffect, useMemo } from "react"
import { useDispatch, useGlobalState } from "../StateProvider"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import ErrorPage from "../ErrorPage"
import ListenerList from "../listeners/ListenerList"
import PoolList from "../pools/PoolList"
import L7PolicyList from "../l7policies/L7PolicyList"
import L7ERuleList from "../l7Rules/L7RuleList"
import MemberList from "../members/MemberList"
import HealthMonitor from "../healthmonitor/HealthMonitor"
import Log from "../shared/logger"

const Details = (props) => {
  const dispatch = useDispatch()
  const state = useGlobalState().loadbalancers
  const { persistLoadbalancer } = useLoadbalancer()

  const [error, setError] = useState(null)
  const [loadbalancerId, setLoadbalancerId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Log.debug("FETCH details")
    connect()
    return function cleanup() {
      // deselect the loadbalancer
      dispatch({ type: "SET_LOADBALANCER_SEARCH_TERM", searchTerm: "" })
      dispatch({ type: "SET_LOADBALANCERS_SELECTED_ITEM", selected: null })
      // deselect the listener
      dispatch({ type: "SET_LISTENERS_SEARCH_TERM", searchTerm: "" })
      dispatch({ type: "SET_LISTENERS_SELECTED_ITEM", selected: null })
      // deselect the pool
      dispatch({ type: "SET_POOLS_SEARCH_TERM", searchTerm: "" })
      dispatch({ type: "SET_POOLS_SELECTED_ITEM", selected: null })
    }
  }, [])

  const connect = () => {
    let id =
      props.match && props.match.params && props.match.params.loadbalancerID
    setLoadbalancerId(id)
    setError(null)

    if (id) {
      // filter the loadbalancer list to show just the one item
      dispatch({ type: "SET_LOADBALANCER_SEARCH_TERM", searchTerm: id })
      // set to selected to disable elementes on the loadbalancer list
      dispatch({ type: "SET_LOADBALANCERS_SELECTED_ITEM", selected: id })

      const loadbalancer = state.items.find((item) => item.id == id)
      if (!loadbalancer) {
        setLoading(true)
        persistLoadbalancer(id)
          .then((response) => {
            setLoading(false)
          })
          .catch((error) => {
            setError(error)
            setLoading(false)
          })
      }
    }
  }

  const headerTitle = (loading, lb) => {
    if (loading) {
      return (
        <h3 className="mt-4">
          Details for{" "}
          <small>
            <span className="spinner" />
          </small>
        </h3>
      )
    }
    if (loadbalancer) {
      if (loadbalancer.name) {
        return (
          <h3 className="mt-4">
            Details for <b>{loadbalancer.name}</b>{" "}
            <small>({loadbalancer.id})</small>
          </h3>
        )
      } else {
        return <h3 className="mt-4">Details for {loadbalancer.id}</h3>
      }
    }
  }

  let loadbalancer = state.items.find((item) => item.id == loadbalancerId)
  return useMemo(() => {
    Log.debug("RENDER Details list")
    return (
      <>
        {error ? (
          <ErrorPage
            headTitle="Load Balancers Details"
            error={error}
            onReload={connect}
          />
        ) : (
          <>
            {headerTitle(loading, loadbalancer)}

            {loadbalancer && (
              <>
                <ListenerList props={props} loadbalancerID={loadbalancer.id} />

                <div className="multiple-subtable">
                  <L7PolicyList
                    props={props}
                    loadbalancerID={loadbalancer.id}
                  />
                  <L7ERuleList props={props} loadbalancerID={loadbalancer.id} />
                </div>

                <PoolList props={props} loadbalancerID={loadbalancer.id} />
                <div className="multiple-subtable">
                  <HealthMonitor
                    props={props}
                    loadbalancerID={loadbalancer.id}
                  />
                  <MemberList props={props} loadbalancerID={loadbalancer.id} />
                </div>
              </>
            )}
          </>
        )}
      </>
    )
  }, [error, loading, loadbalancer, props])
}

export default Details
