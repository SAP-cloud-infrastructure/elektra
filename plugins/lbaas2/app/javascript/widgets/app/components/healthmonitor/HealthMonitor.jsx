import React, { useEffect, useState, useMemo } from "react"
import HelpPopover from "../shared/HelpPopover"
import { useGlobalState } from "../StateProvider"
import useHealthMonitor from "../../lib/hooks/useHealthMonitor"
import usePool from "../../lib/hooks/usePool"
import ErrorPage from "../ErrorPage"
import { addNotice, addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import HealthmonitorDetails from "./HealthmonitorDetails"
import { policy } from "lib/policy"
import { scope } from "lib/ajax_helper"
import SmartLink from "../shared/SmartLink"
import Log from "../shared/logger"
import { fetchPool } from "../../actions/pool"
import { findPool } from "../../helpers/poolHelper"
import {
  errorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import { findLoadbalancer } from "../../helpers/loadbalancerHelpers"

const HealthMonitor = ({ props, loadbalancerID }) => {
  const { removeHealthmonitor, persistHealthmonitor, resetState } =
    useHealthMonitor()
  const poolID = useGlobalState().pools.selected
  const poolError = useGlobalState().pools.error
  const pools = useGlobalState().pools.items
  const { persistPool } = usePool()
  const state = useGlobalState().healthmonitors
  const loadbalancers = useGlobalState().loadbalancers.items

  const [triggerInitialLoad, setTriggerInitialLoad] = useState(false)

  useEffect(() => {
    initialLoad()
  }, [poolID, triggerInitialLoad])

  const initialLoad = () => {
    // if pool selected
    if (poolID) {
      // find the pool to get the health monitor id
      const pool = findPool(pools, poolID)
      // in case everything is being load from the url it can happen that the pool is not in the first pool load and has to be loaded extra
      // fetching the pool extra the initial load is being retriggered
      fetchPool(loadbalancerID, poolID)
        .then((data) => {
          // Retrigger the initialLoad so we can check if there is a healthmonitor to load
          setTriggerInitialLoad(true)
        })
        .catch((error) => {
          // if error happend loading the pool it will be shown in the pool section
        })

      if (pool && pool.healthmonitor_id) {
        // if lb loaded get the vip_port_id
        let options = null
        const lb = findLoadbalancer(loadbalancers, loadbalancerID)
        if (lb) {
          options = { vip_port_id: lb.vip_port_id }
        }

        Log.debug("FETCH HEALTH MONITOR")
        persistHealthmonitor(
          loadbalancerID,
          poolID,
          pool.healthmonitor_id,
          options
        )
          .then((data) => {})
          .catch((error) => {})
      } else {
        // reset healthmonitor state. Remove any saved healthmonitor in the state
        resetState()
      }
    }
  }

  const canCreate = useMemo(
    () =>
      policy.isAllowed("lbaas2:healthmonitor_create", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canEdit = useMemo(
    () =>
      policy.isAllowed("lbaas2:healthmonitor_update", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canShowJSON = useMemo(
    () =>
      policy.isAllowed("lbaas2:healthmonitor_get", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canDelete = useMemo(
    () =>
      policy.isAllowed("lbaas2:healthmonitor_delete", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const onRemoveClick = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const healthmonitorID = healthmonitor.id.slice()
    const healthmonitorName = healthmonitor.name.slice()
    return removeHealthmonitor(lbID, poolID, healthmonitorID, healthmonitorName)
      .then((data) => {
        addNotice(
          <>
            Health Monitor <b>{healthmonitorName}</b> ({healthmonitorID}) is
            being deleted.
          </>
        )
        // fetch the pool again containing the new healthmonitor so it gets updated fast
        persistPool(lbID, poolID)
          .then(() => {})
          .catch((error) => {})
      })
      .catch((error) => {
        addError(
          React.createElement(ErrorsList, {
            errors: errorMessage(error),
          })
        )
      })
  }

  const error = state.error
  const healthmonitor = state.item
  const isLoading = state.isLoading

  return useMemo(() => {
    Log.debug("RENDER healthmonitor")
    return (
      <>
        {poolID && !poolError && (
          <>
            {error ? (
              <div className="healthmonitor subtable multiple-subtable-left">
                <ErrorPage
                  headTitle="Health Monitor"
                  error={error}
                  onReload={initialLoad}
                />
              </div>
            ) : (
              <div className="healthmonitor subtable multiple-subtable-left">
                <div className="display-flex multiple-subtable-header">
                  <h4>Health Monitor</h4>
                  <HelpPopover text="Checks the health of the pool members. Unhealthy members will be taken out of traffic schedule. Sets a load balancer to OFFLINE when all members are unhealthy." />
                </div>

                <div className="toolbar searchToolbar">
                  {healthmonitor ? (
                    <div className="main-buttons">
                      <div className="btn-group   ">
                        <button
                          className="btn btn-secondary btn-xs dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded={true}
                        >
                          <span className="fa fa-cog"></span>
                        </button>
                        <ul
                          className="dropdown-menu dropdown-menu-right"
                          role="menu"
                        >
                          <li>
                            <SmartLink
                              to={`/loadbalancers/${loadbalancerID}/pools/${poolID}/healthmonitor/${
                                healthmonitor.id
                              }/edit?${searchParamsToString(props)}`}
                              isAllowed={canEdit}
                              notAllowedText="Not allowed to edit. Please check with your administrator."
                            >
                              Edit
                            </SmartLink>
                          </li>
                          <li>
                            <SmartLink
                              onClick={onRemoveClick}
                              isAllowed={canDelete}
                              notAllowedText="Not allowed to delete. Please check with your administrator."
                            >
                              Delete
                            </SmartLink>
                          </li>
                          <li>
                            <SmartLink
                              to={`/loadbalancers/${loadbalancerID}/pools/${poolID}/healthmonitor/${
                                healthmonitor.id
                              }/json?${searchParamsToString(props)}`}
                              isAllowed={canShowJSON}
                              notAllowedText="Not allowed to get JSOn. Please check with your administrator."
                            >
                              JSON
                            </SmartLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="main-buttons">
                      <SmartLink
                        disabled={isLoading}
                        to={`/loadbalancers/${loadbalancerID}/pools/${poolID}/healthmonitor/new?${searchParamsToString(
                          props
                        )}`}
                        className="btn btn-primary btn-xs"
                        isAllowed={canCreate}
                        notAllowedText="Not allowed to create. Please check with your administrator."
                      >
                        New Health Monitor
                      </SmartLink>
                    </div>
                  )}
                </div>

                {healthmonitor ? (
                  <HealthmonitorDetails
                    loadbalancerID={loadbalancerID}
                    poolID={poolID}
                    healthmonitor={healthmonitor}
                  />
                ) : (
                  <div className="multiple-subtable-scroll-body">
                    {isLoading ? (
                      <span className="spinner" />
                    ) : (
                      "No Health Monitor found"
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    )
  }, [
    poolID,
    poolError,
    JSON.stringify(healthmonitor),
    error,
    isLoading,
    props,
  ])
}

export default HealthMonitor
