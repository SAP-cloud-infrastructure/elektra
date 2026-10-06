import React, { useEffect, useState, useMemo } from "react"

import CopyPastePopover from "../shared/CopyPastePopover"
import StaticTags from "../StaticTags"
import useL7Policy from "../../lib/hooks/useL7Policy"
import { Link } from "react-router-dom"
import { addNotice, addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import useListener from "../../lib/hooks/useListener"
import SmartLink from "../shared/SmartLink"
import { policy } from "lib/policy"
import { scope } from "lib/ajax_helper"
import Log from "../shared/logger"
import useStatus from "../../lib/hooks/useStatus"
import usePolling from "../../lib/hooks/usePolling"
import {
  errorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import { actionRedirect } from "../../helpers/l7PolicyHelpers"

const L7PolicySelected = ({ props, listenerID, l7Policy, onBackLink }) => {
  const { removeL7Policy, persistL7Policy, reset } = useL7Policy()
  const { persistListener } = useListener()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const { entityStatus } = useStatus(
    l7Policy.operating_status,
    l7Policy.provisioning_status
  )

  useEffect(() => {
    const params = matchParams(props)
    setLoadbalancerID(params.loadbalancerID)
  }, [])

  const pollingCallback = () => {
    return persistL7Policy(loadbalancerID, listenerID, l7Policy.id).catch(
      (error) => {
        if (error && error.status == 404) {
          // deselect l7Policy
          reset()
        }
      }
    )
  }

  usePolling({
    delay: l7Policy.provisioning_status.includes("PENDING") ? 20000 : 60000,
    callback: pollingCallback,
    active: true,
  })

  const canEdit = useMemo(
    () =>
      policy.isAllowed("lbaas2:l7policy_update", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canDelete = useMemo(
    () =>
      policy.isAllowed("lbaas2:l7policy_delete", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const canShowJSON = useMemo(
    () =>
      policy.isAllowed("lbaas2:l7policy_get", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const handleDelete = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const l7policyID = l7Policy.id
    const l7policyName = l7Policy.name
    return removeL7Policy(loadbalancerID, listenerID, l7policyID, l7policyName)
      .then((data) => {
        addNotice(
          <>
            L7 Policy <b>{l7policyName}</b> ({l7policyID}) is being deleted.
          </>
        )
        // fetch the listener again containing the new policy so it gets updated fast
        persistListener(loadbalancerID, listenerID)
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

  return (
    <>
      <div className="selected-l7policy-head">
        <div className="row selected-l7policy-head-content">
          <div className="col-md-12">
            <div className="display-flex">
              <Link className="back-link" to="#" onClick={onBackLink}>
                <i className="fa fa-chevron-circle-left"></i>
                Back to L7 Policies
              </Link>
              <div className="btn-group btn-right">
                <button
                  className="btn btn-secondary btn-xs dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded={true}
                >
                  <span className="fa fa-cog"></span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" role="menu">
                  <li>
                    <SmartLink
                      to={`/loadbalancers/${loadbalancerID}/listeners/${listenerID}/l7policies/${
                        l7Policy.id
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
                      to={`/loadbalancers/${loadbalancerID}/listeners/${listenerID}/l7policies/${
                        l7Policy.id
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
          </div>
        </div>
      </div>

      <div className="multiple-subtable-scroll-body">
        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>Name/ID:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">{l7Policy.name || l7Policy.id}</div>
          </div>
          {l7Policy.name && (
            <div className="row">
              <div className="col-md-12 text-nowrap">
                <small className="info-text">
                  {
                    <CopyPastePopover
                      text={l7Policy.id}
                      bsClass="cp copy-paste-ids"
                    />
                  }
                </small>
              </div>
            </div>
          )}
        </div>

        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>Description:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">{l7Policy.description}</div>
          </div>
        </div>

        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>Status:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">{entityStatus}</div>
          </div>
        </div>

        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>Tags:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <StaticTags tags={l7Policy.tags} />
            </div>
          </div>
        </div>

        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>Position:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">{l7Policy.position}</div>
          </div>
        </div>

        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>Action/Redirect:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              {l7Policy.action}
              {actionRedirect(l7Policy.action).map((redirect, index) => (
                <div key={index}>
                  <ul>
                    <li>{redirect.label}: </li>
                    {redirect.value === "redirect_prefix" ||
                    redirect.value === "redirect_url" ? (
                      <CopyPastePopover
                        text={l7Policy[redirect.value]}
                        shouldPopover={false}
                        bsClass="cp label-right"
                      />
                    ) : (
                      <span>{l7Policy[redirect.value]}</span>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="selected-l7policy-entry">
          <div className="row">
            <div className="col-md-12">
              <b>L7 Rules:</b>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">{l7Policy.rules.length}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default L7PolicySelected
