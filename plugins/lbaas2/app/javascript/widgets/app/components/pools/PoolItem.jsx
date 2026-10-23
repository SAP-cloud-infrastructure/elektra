import React, { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import StaticTags from "../StaticTags"
import CopyPastePopover from "../shared/CopyPastePopover"
import PopoverInfo from "../shared/PopoverInfo"
import CachedInfoPopoverContent from "./CachedInfoPopoverContent"
import CachedInfoPopoverContentListeners from "./CachedInfoPopoverContentListeners"
import CachedInfoPopoverContentContainers from "../shared/CachedInfoPopoverContentContainers"
import usePool from "../../lib/hooks/usePool"
import { addNotice, addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import { policy } from "lib/policy"
import { scope } from "lib/ajax_helper"
import SmartLink from "../shared/SmartLink"
import Log from "../shared/logger"
import DropDownMenu from "../shared/DropdownMenu"
import useStatus from "../../lib/hooks/useStatus"
import usePolling from "../../lib/hooks/usePolling"
import BooleanLabel from "../shared/BooleanLabel"
import {
  errorMessage,
  matchParams,
  searchParamsToString,
  MyHighlighter,
} from "../../helpers/commonHelpers"

const PoolItem = ({ props, pool, searchTerm, disabled, shouldPoll }) => {
  const { persistPool, removePool, onSelectPool, reset } = usePool()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const { persistLoadbalancer } = useLoadbalancer()
  const { entityStatus } = useStatus(
    pool.operating_status,
    pool.provisioning_status,
    { operatingStatusErrorExtraTitle: "The pool has no members" }
  )

  useEffect(() => {
    const params = matchParams(props)
    setLoadbalancerID(params.loadbalancerID)
  }, [])

  const pollingCallback = () => {
    return persistPool(loadbalancerID, pool.id).catch((error) => {
      if (error && error.status == 404) {
        // check if the pool is selected and if yes deselect the item
        if (disabled) {
          reset()
        }
      }
    })
  }

  usePolling({
    delay: pool.provisioning_status.includes("PENDING") ? 20000 : 60000,
    callback: pollingCallback,
    active: shouldPoll || pool?.provisioning_status?.includes("PENDING"),
  })

  const canEdit = useMemo(
    () =>
      policy.isAllowed("lbaas2:pool_update", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canDelete = useMemo(
    () =>
      policy.isAllowed("lbaas2:pool_delete", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canShowJSON = useMemo(
    () =>
      policy.isAllowed("lbaas2:pool_get", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const handleDelete = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const poolID = pool.id
    const poolName = pool.name
    return removePool(loadbalancerID, poolID, poolName)
      .then((response) => {
        addNotice(
          <>
            Pool <b>{poolName}</b> ({poolID}) is being deleted.
          </>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistLoadbalancer(loadbalancerID).catch((error) => {})
        // TODO: back to the poles
      })
      .catch((error) => {
        addError(
          React.createElement(ErrorsList, {
            errors: errorMessage(error),
          })
        )
      })
  }

  const onPoolClick = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onSelectPool(props, pool.id)
  }

  const displayName = () => {
    const name = pool.name || pool.id
    if (disabled) {
      return (
        <div className="info-text">
          <CopyPastePopover
            text={name}
            size={20}
            sliceType="MIDDLE"
            shouldCopy={false}
            bsClass="cp copy-paste-ids"
          />
        </div>
      )
    } else {
      return (
        <Link to="#" onClick={onPoolClick}>
          <CopyPastePopover
            text={name}
            size={20}
            sliceType="MIDDLE"
            shouldPopover={false}
            shouldCopy={false}
            searchTerm={searchTerm}
          />
        </Link>
      )
    }
  }
  const displayID = () => {
    if (pool.name) {
      if (disabled) {
        return (
          <div className="info-text">
            <CopyPastePopover
              text={pool.id}
              size={12}
              sliceType="MIDDLE"
              bsClass="cp copy-paste-ids"
              shouldPopover={false}
            />
          </div>
        )
      } else {
        return (
          <CopyPastePopover
            text={pool.id}
            size={12}
            sliceType="MIDDLE"
            bsClass="cp copy-paste-ids"
            searchTerm={searchTerm}
          />
        )
      }
    }
  }

  const listenersIDs = pool.listeners.map((m) => m.id)
  const displayAssignedTo = () => {
    if (pool.listeners && pool.listeners.length > 0) {
      return (
        <div className="display-flex">
          <span>Listeners:</span>
          <div className="label-right">
            <PopoverInfo
              popoverId={"pool-listeners-popover-" + listenersIDs.id}
              buttonName={listenersIDs.length}
              title={<>Listeners</>}
              content={
                <CachedInfoPopoverContentListeners
                  props={props}
                  loadbalancerID={loadbalancerID}
                  listenerIDs={listenersIDs}
                  cachedListeners={pool.cached_listeners}
                />
              }
              footer="Preview from cache"
            />
          </div>
        </div>
      )
    } else {
      return <>Load Balancer</>
    }
  }

  const collectContainers = () => {
    const containers = [
      { name: "Certificate Secret", ref: pool.tls_container_ref },
      { name: "Authentication Secret (CA)", ref: pool.ca_tls_container_ref },
    ]
    var filteredContainers = containers.reduce((filteredContainers, item) => {
      if (
        (item.ref && item.ref.length > 0) ||
        (item.refList && item.refList.length > 0)
      ) {
        filteredContainers.push(item)
      }
      return filteredContainers
    }, [])
    return filteredContainers
  }

  const displaySecrets = () => {
    const containers = collectContainers()
    return (
      <>
        {pool.tls_enabled && (
          <div className="display-flex">
            <span>Secrets: </span>
            <div className="label-right">
              <PopoverInfo
                popoverId={"pool-secrets-popover-" + pool.id}
                buttonName={containers.length}
                title={<>Secrets</>}
                content={
                  <CachedInfoPopoverContentContainers containers={containers} />
                }
                footer="Preview from cache"
              />
            </div>
          </div>
        )}
      </>
    )
  }

  const displayTlsCiphers = () => {
    const ciphersList = pool.tls_ciphers?.split(":") || []
    return (
      <>
        {pool.tls_enabled && (
          <div className="display-flex">
            <span>TLS ciphers: </span>
            <div className="label-right">
              <PopoverInfo
                popoverId={"tls-ciphers-popover-" + pool.id}
                buttonName={ciphersList.length}
                title="TLS ciphers"
                content={<StaticTags tags={ciphersList} />}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  const memberIDs = pool.members.map((m) => m.id)
  return (
    <tr className={disabled ? "table-active" : ""}>
      <td className="snug-nowrap">
        {displayName()}
        {displayID()}
        <CopyPastePopover
          text={pool.description}
          size={20}
          shouldCopy={false}
          shouldPopover={true}
          searchTerm={searchTerm}
        />
      </td>
      <td>{entityStatus}</td>
      <td>
        <StaticTags tags={pool.tags} />
      </td>
      <td>{pool.lb_algorithm}</td>
      <td>
        <MyHighlighter search={searchTerm}>{pool.protocol}</MyHighlighter>
      </td>
      <td>
        {pool.session_persistence && <div>{pool.session_persistence.type}</div>}
        {pool.session_persistence &&
          pool.session_persistence.type == "APP_COOKIE" && (
            <div>{pool.session_persistence.cookie_name}</div>
          )}
      </td>
      <td>{displayAssignedTo()}</td>
      <td>
        <BooleanLabel value={pool.tls_enabled} />
        {displaySecrets()}
        {displayTlsCiphers()}
      </td>
      <td>
        <BooleanLabel value={pool.healthmonitor_id} />
      </td>
      <td>
        {disabled ? (
          <span className="info-text">{memberIDs.length}</span>
        ) : (
          <PopoverInfo
            popoverId={"member-popover-" + memberIDs.id}
            buttonName={memberIDs.length}
            title={
              <>
                Members
                <Link to="#" onClick={onPoolClick} style={{ float: "right" }}>
                  Show all
                </Link>
              </>
            }
            content={
              <CachedInfoPopoverContent
                props={props}
                lbID={loadbalancerID}
                poolID={pool.id}
                memberIDs={memberIDs}
                cachedMembers={pool.cached_members}
              />
            }
            footer="Preview from cache"
          />
        )}
      </td>
      <td>
        <DropDownMenu buttonIcon={<span className="fa fa-cog" />}>
          <li>
            <SmartLink
              to={`/loadbalancers/${loadbalancerID}/pools/${
                pool.id
              }/edit?${searchParamsToString(props)}`}
              isAllowed={canEdit}
              notAllowedText="Not allowed to edit. Please check with your administrator."
            >
              Edit
            </SmartLink>
          </li>
          <li>
            <SmartLink
              onClick={handleDelete}
              isAllowed={canDelete}
              notAllowedText="Not allowed to delete. Please check with your administrator."
            >
              Delete
            </SmartLink>
          </li>
          <li>
            <SmartLink
              to={`/loadbalancers/${loadbalancerID}/pools/${
                pool.id
              }/json?${searchParamsToString(props)}`}
              isAllowed={canShowJSON}
              notAllowedText="Not allowed to get JSOn. Please check with your administrator."
            >
              JSON
            </SmartLink>
          </li>
        </DropDownMenu>
      </td>
    </tr>
  )
}

export default PoolItem
