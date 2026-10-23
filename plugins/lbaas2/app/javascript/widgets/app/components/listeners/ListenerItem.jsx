import React, { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import StaticTags from "../StaticTags"
import CopyPastePopover from "../shared/CopyPastePopover"
import PopoverInfo from "../shared/PopoverInfo"
import CachedInfoPopoverContent from "./CachedInfoPopoverContent"
import CachedInfoPopoverContentContainers from "../shared/CachedInfoPopoverContentContainers"
import {
  certificateContainerRelation,
  clientAuthenticationRelation,
  tlsCiphersRelation,
} from "../../helpers/listenerHelper"
import useListener from "../../lib/hooks/useListener"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import { addNotice, addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import { policy } from "lib/policy"
import { scope } from "lib/ajax_helper"
import SmartLink from "../shared/SmartLink"
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

const ListenerItem = ({
  props,
  listener,
  searchTerm,
  disabled,
  shouldPoll,
}) => {
  const { persistListener, removeListener, onSelectListener, reset } =
    useListener()
  const { persistLoadbalancer } = useLoadbalancer()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const { entityStatus } = useStatus(
    listener.operating_status,
    listener.provisioning_status
  )

  useEffect(() => {
    const params = matchParams(props)
    setLoadbalancerID(params.loadbalancerID)
  }, [])

  const pollingCallback = () => {
    return persistListener(loadbalancerID, listener.id).catch((error) => {
      if (error && error.status == 404) {
        // check if the listener is selected and if yes deselect the item from the list
        if (disabled) {
          reset()
        }
      }
    })
  }

  usePolling({
    delay: listener.provisioning_status.includes("PENDING") ? 20000 : 60000,
    callback: pollingCallback,
    active: shouldPoll || listener?.provisioning_status?.includes("PENDING"),
  })

  const onListenerClick = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onSelectListener(props, listener.id)
  }

  const canEdit = useMemo(
    () =>
      policy.isAllowed("lbaas2:listener_update", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canDelete = useMemo(
    () =>
      policy.isAllowed("lbaas2:listener_delete", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canShowJSON = useMemo(
    () =>
      policy.isAllowed("lbaas2:listener_get", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const handleDelete = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const listenerID = listener.id
    const listenerName = listener.name
    return removeListener(loadbalancerID, listenerID, listenerName)
      .then((data) => {
        addNotice(
          <>
            Listener <b>{listenerName}</b> ({listenerID}) is being deleted.
          </>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistLoadbalancer(loadbalancerID).catch((error) => {})
      })
      .catch((error) => {
        addError(
          React.createElement(ErrorsList, {
            errors: errorMessage(error),
          })
        )
      })
  }

  const displayName = () => {
    const name = listener.name || listener.id
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
        <Link to="#" onClick={onListenerClick}>
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
    if (listener.name) {
      if (disabled) {
        return (
          <div className="info-text">
            <CopyPastePopover
              text={listener.id}
              size={12}
              sliceType="MIDDLE"
              bsClass="cp copy-paste-ids"
            />
          </div>
        )
      } else {
        return (
          <CopyPastePopover
            text={listener.id}
            size={12}
            sliceType="MIDDLE"
            bsClass="cp copy-paste-ids"
            searchTerm={searchTerm}
          />
        )
      }
    }
  }

  const collectContainers = () => {
    const containers = [
      {
        name: "Certificate Secret",
        ref: listener.default_tls_container_ref,
      },
      { name: "SNI Secrets", refList: listener.sni_container_refs },
      {
        name: "Client Authentication Secret",
        ref: listener.client_ca_tls_container_ref,
      },
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

  const displayProtocol = () => {
    const containers = collectContainers()
    const ciphersList = listener.tls_ciphers?.split(":") || []
    const numberOfElements = containers.reduce(
      (numberOfElements, container) => {
        if (container.ref) {
          return numberOfElements + 1
        } else if (container.refList) {
          return numberOfElements + container.refList.length
        } else {
          return numberOfElements
        }
      },
      0
    )

    return (
      <>
        <MyHighlighter search={searchTerm}>{listener.protocol}</MyHighlighter>
        {clientAuthenticationRelation(listener.protocol) && (
          <div className="display-flex">
            <span>Client Auth: </span>
            <span className="label-right">
              {listener.client_authentication}
            </span>
          </div>
        )}
        {certificateContainerRelation(listener.protocol) && (
          <div className="display-flex">
            <span>Secrets: </span>
            <div className="label-right">
              <PopoverInfo
                popoverId={"listeners-secrets-popover-" + listener.id}
                buttonName={numberOfElements}
                title={<>Secrets</>}
                content={
                  <CachedInfoPopoverContentContainers containers={containers} />
                }
                footer="Preview from cache"
              />
            </div>
          </div>
        )}
        {tlsCiphersRelation(listener.protocol) && (
          <div className="display-flex">
            <span>TLS ciphers: </span>
            <div className="label-right">
              <PopoverInfo
                popoverId={"tls-ciphers-popover-" + listener.id}
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

  const l7PolicyIDs = listener.l7policies.map((l7p) => l7p.id)

  return (
    <tr className={disabled ? "table-active" : ""}>
      <td className="snug-nowrap">
        {displayName()}
        {displayID()}
        <CopyPastePopover
          text={listener.description}
          size={20}
          shouldCopy={false}
          shouldPopover={true}
          searchTerm={searchTerm}
        />
      </td>
      <td>{entityStatus}</td>
      <td>
        <StaticTags tags={listener.tags} />
      </td>
      <td>{displayProtocol()}</td>
      <td>
        <MyHighlighter search={searchTerm}>
          {listener.protocol_port}
        </MyHighlighter>
      </td>
      <td>
        <BooleanLabel
          value={listener.default_pool_id}
          tooltipText={listener.default_pool_id}
        />
      </td>
      <td>{listener.connection_limit}</td>
      <td>
        <StaticTags tags={listener.insert_headers} />
      </td>
      <td>
        {disabled ? (
          <span className="info-text">{l7PolicyIDs.length}</span>
        ) : (
          <PopoverInfo
            popoverId={"l7policies-popover-" + listener.id}
            buttonName={l7PolicyIDs.length}
            title={
              <>
                L7 Policies
                <Link
                  to="#"
                  onClick={onListenerClick}
                  style={{ float: "right" }}
                >
                  Show all
                </Link>
              </>
            }
            content={
              <CachedInfoPopoverContent
                props={props}
                lbID={loadbalancerID}
                listenerID={listener.id}
                l7PolicyIDs={l7PolicyIDs}
                cachedl7PolicyIDs={listener.cached_l7policies}
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
              to={`/loadbalancers/${loadbalancerID}/listeners/${
                listener.id
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
              to={`/loadbalancers/${loadbalancerID}/listeners/${
                listener.id
              }/json?${searchParamsToString(props)}`}
              isAllowed={canShowJSON}
              notAllowedText="Not allowed to get JSOn. Please check with your administrator."
            >
              JSON
            </SmartLink>
          </li>
          <li className="divider"></li>
          <li>
            <SmartLink
              to={`/loadbalancers/${loadbalancerID}/listeners/${
                listener.id
              }/cidrs?${searchParamsToString(props)}`}
              isAllowed={canEdit}
              notAllowedText="Not allowed to edit cidrs. Please check with your administrator."
            >
              Allowed CIDRs
            </SmartLink>
          </li>
        </DropDownMenu>
      </td>
    </tr>
  )
}

export default ListenerItem
