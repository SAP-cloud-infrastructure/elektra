import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import PopoverInfo from "../shared/PopoverInfo"
import CachedInfoPopoverListenerContent from "./CachedInfoPopoverListenerContent"
import CachedInfoPopoverPoolContent from "./CachedInfoPopoverPoolContent"
import StaticTags from "../StaticTags"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import CopyPastePopover from "../shared/CopyPastePopover"
import { addNotice, addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import SmartLink from "../shared/SmartLink"
import { policy } from "lib/policy"
import { scope } from "lib/ajax_helper"
import Log from "../shared/logger"
import useStatus from "../../lib/hooks/useStatus"
import usePolling from "../../lib/hooks/usePolling"
import { errorMessage, searchParamsToString } from "../../helpers/commonHelpers"

const LoadbalancerItem = ({
  props,
  loadbalancer,
  searchTerm,
  disabled,
  shouldPoll,
}) => {
  const { persistLoadbalancer, removeLoadbalancer, detachFIP, reset } =
    useLoadbalancer()
  const { entityStatus } = useStatus(
    loadbalancer.operating_status,
    loadbalancer.provisioning_status
  )

  const pollingCallback = () => {
    return persistLoadbalancer(loadbalancer.id).catch((error) => {
      if (error && error.status == 404) {
        // check if the loadbalancer is selected and if yes deselect the item
        if (disabled) {
          reset()
        }
      }
    })
  }

  usePolling({
    delay: loadbalancer.provisioning_status.includes("PENDING") ? 20000 : 60000,
    callback: pollingCallback,
    active:
      shouldPoll || loadbalancer?.provisioning_status?.includes("PENDING"),
  })

  const canDelete = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_delete", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canEdit = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_update", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canAttachFIP = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_attach_fip", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canDetachFIP = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_detach_fip", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canShowJSON = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_get", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canShowDeviceInfo = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_device", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const handleDelete = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const ladbalancerID = loadbalancer.id
    const loadbalancerName = loadbalancer.name
    return removeLoadbalancer(loadbalancerName, ladbalancerID)
      .then((data) => {
        addNotice(
          <>
            Load Balancer <b>{loadbalancerName}</b> ({ladbalancerID}) is being
            deleted.
          </>
        )
      })
      .catch((error) => {
        addError(
          React.createElement(ErrorsList, {
            errors: errorMessage(error),
          })
        )
      })
  }

  const handleDetachFIP = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    const ladbalancerID = loadbalancer.id
    const floatingIP = loadbalancer.floating_ip.id
    return detachFIP(ladbalancerID, { floating_ip: floatingIP })
      .then((response) => {
        addNotice(
          <>
            Floating IP <b>{loadbalancer.floating_ip.floating_ip_address}</b> (
            {floatingIP}) is being detached.
          </>
        )
      })
      .catch((error) => {
        addError(
          React.createElement(ErrorsList, {
            errors: errorMessage(error),
          })
        )
      })
  }

  const poolIds = loadbalancer.pools.map((p) => p.id)
  const listenerIds = loadbalancer.listeners.map((l) => l.id)
  const displayName = () => {
    const name = loadbalancer.name || loadbalancer.id
    if (disabled) {
      return (
        <span className="info-text">
          <CopyPastePopover
            text={name}
            size={40}
            sliceType="MIDDLE"
            shouldCopy={false}
            bsClass="cp copy-paste-ids"
          />
        </span>
      )
    } else {
      return (
        <Link to={`/loadbalancers/${loadbalancer.id}/show`}>
          <CopyPastePopover
            text={name}
            size={40}
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
    if (loadbalancer.name) {
      if (disabled) {
        return (
          <div className="info-text">
            <CopyPastePopover
              text={loadbalancer.id}
              size={40}
              sliceType="MIDDLE"
              bsClass="cp copy-paste-ids"
            />
          </div>
        )
      } else {
        return (
          <CopyPastePopover
            text={loadbalancer.id}
            size={40}
            sliceType="MIDDLE"
            bsClass="cp copy-paste-ids"
            searchTerm={searchTerm}
          />
        )
      }
    }
  }

  Log.debug("RENDER loadbalancer list item id-->", loadbalancer.id)
  return (
    <tr className={disabled ? "active" : ""}>
      <td className="snug-nowrap">
        {displayName()}
        {displayID()}
        <CopyPastePopover
          text={loadbalancer.description}
          size={40}
          shouldCopy={false}
          shouldPopover={true}
          searchTerm={searchTerm}
        />
      </td>
      <td>{entityStatus}</td>
      <td>
        <StaticTags tags={loadbalancer.tags} />
      </td>
      <td className="snug-nowrap">
        {loadbalancer.subnet && (
          <>
            <p
              className="list-group-item-text list-group-item-text-copy"
              data-is-from-cache={loadbalancer.subnet_from_cache}
            >
              {loadbalancer.subnet.name}
            </p>
          </>
        )}
        {loadbalancer.availability_zone && (
          <p className="list-group-item-text list-group-item-text-copy">
            {loadbalancer.availability_zone}
          </p>
        )}
        {loadbalancer.vip_address && (
          <>
            <p className="list-group-item-text list-group-item-text-copy display-flex">
              <i className="fa fa-desktop fa-fw" />
              <CopyPastePopover
                text={loadbalancer.vip_address}
                size={20}
                searchTerm={searchTerm}
              />
            </p>
          </>
        )}
        {loadbalancer.floating_ip && (
          <>
            <p className="list-group-item-text list-group-item-text-copy display-flex">
              <i className="fa fa-globe fa-fw" />
              <CopyPastePopover
                text={loadbalancer.floating_ip.floating_ip_address}
                size={20}
                searchTerm={searchTerm}
              />
            </p>
          </>
        )}
      </td>
      <td>
        {disabled ? (
          <span className="info-text">{listenerIds.length}</span>
        ) : (
          <PopoverInfo
            popoverId={"listener-popover-" + loadbalancer.id}
            buttonName={listenerIds.length}
            title={
              <>
                Listeners
                <Link
                  to={`/loadbalancers/${loadbalancer.id}/show`}
                  style={{ float: "right" }}
                >
                  Show all
                </Link>
              </>
            }
            content={
              <CachedInfoPopoverListenerContent
                lbID={loadbalancer.id}
                listenerIds={listenerIds}
                cachedListeners={loadbalancer.cached_listeners}
              />
            }
            footer="Preview from cache"
          />
        )}
      </td>
      <td>
        {disabled ? (
          <span className="info-text">{poolIds.length}</span>
        ) : (
          <PopoverInfo
            popoverId={"pools-popover-" + loadbalancer.id}
            buttonName={poolIds.length}
            title={
              <>
                Pools
                <Link
                  to={`/loadbalancers/${loadbalancer.id}/show`}
                  style={{ float: "right" }}
                >
                  Show all
                </Link>
              </>
            }
            content={
              <CachedInfoPopoverPoolContent
                lbID={loadbalancer.id}
                poolIds={poolIds}
                cachedPools={loadbalancer.cached_pools}
              />
            }
            footer="Preview from cache"
          />
        )}
      </td>
      <td>
        <div className="btn-group">
          <button
            className="btn btn-secondary btn-sm dropdown-toggle"
            type="button"
            data-toggle="dropdown"
            aria-expanded={true}
          >
            <span className="fa fa-cog"></span>
          </button>
          <ul className="dropdown-menu dropdown-menu-right" role="menu">
            <li>
              <SmartLink
                to={
                  disabled
                    ? `/loadbalancers/${
                        loadbalancer.id
                      }/show/edit?${searchParamsToString(props)}`
                    : `/loadbalancers/${
                        loadbalancer.id
                      }/edit?${searchParamsToString(props)}`
                }
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
                to={
                  disabled
                    ? `/loadbalancers/${
                        loadbalancer.id
                      }/show/json?${searchParamsToString(props)}`
                    : `/loadbalancers/${
                        loadbalancer.id
                      }/json?${searchParamsToString(props)}`
                }
                isAllowed={canShowJSON}
                notAllowedText="Not allowed to get JSOn. Please check with your administrator."
              >
                JSON
              </SmartLink>
            </li>
            <li className="divider"></li>
            <li>
              {loadbalancer.floating_ip ? (
                <SmartLink
                  onClick={handleDetachFIP}
                  isAllowed={canDetachFIP}
                  notAllowedText="Not allowed to detach Floating IP. Please check with your administrator."
                >
                  Detach Floating IP
                </SmartLink>
              ) : (
                <SmartLink
                  to={
                    disabled
                      ? `/loadbalancers/${
                          loadbalancer.id
                        }/show/attach_fip?${searchParamsToString(props)}`
                      : `/loadbalancers/${
                          loadbalancer.id
                        }/attach_fip?${searchParamsToString(props)}`
                  }
                  isAllowed={canAttachFIP}
                  notAllowedText="Not allowed to attach Floating IP. Please check with your administrator."
                >
                  Attach Floating IP
                </SmartLink>
              )}
            </li>
            <li>
              <SmartLink
                to={
                  disabled
                    ? `/loadbalancers/${
                        loadbalancer.id
                      }/show/device?${searchParamsToString(props)}`
                    : `/loadbalancers/${
                        loadbalancer.id
                      }/device?${searchParamsToString(props)}`
                }
                isAllowed={canShowDeviceInfo}
                notAllowedText="Not allowed to get device information. Please check with your administrator."
              >
                Device Info
              </SmartLink>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  )
}

LoadbalancerItem.displayName = "LoadbalancerItem"

export default LoadbalancerItem
