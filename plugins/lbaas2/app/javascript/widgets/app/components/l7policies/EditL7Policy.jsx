/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useMemo } from "react"
import { Button, Collapse } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import useL7Policy from "../../lib/hooks/useL7Policy"
import useListener from "../../lib/hooks/useListener"
import ErrorPage from "../ErrorPage"
import SelectInput from "../shared/SelectInput"
import TagsInput from "../shared/TagsInput"
import { addNotice } from "lib/flashes"
import Log from "../shared/logger"
import { fetchPoolsForSelect } from "../../actions/pool"
import {
  errorMessage,
  formErrorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import {
  actionTypes,
  codeTypes,
  actionRedirect,
} from "../../helpers/l7PolicyHelpers"
import { fetchL7Policy } from "../../actions/l7Policy"

const EditL7Policy = (props) => {
  const { updateL7Policy } = useL7Policy()
  const { persistListener } = useListener()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [listenerID, setListenerID] = useState(null)
  const [l7policyID, setL7policyID] = useState(null)

  const [actionType, setActionType] = useState(null)
  const [redirectCode, setRedirectCode] = useState(null)
  const [l7policy, setL7policy] = useState({
    isLoading: false,
    error: null,
    item: null,
  })
  const [poolsLoaded, setPoolsLoaded] = useState(false)
  const [pools, setPools] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [redirectPoolID, setRedirectPoolID] = useState(null)

  useEffect(() => {
    // get the lb
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const ltID = params.listenerID
    const l7pID = params.l7policyID
    setLoadbalancerID(lbID)
    setListenerID(ltID)
    setL7policyID(l7pID)
  }, [])

  useEffect(() => {
    if (l7policyID) {
      loadL7policy()
    }
  }, [l7policyID])

  const loadL7policy = () => {
    Log.debug("fetching l7policy to edit")
    setL7policy({ ...l7policy, isLoading: true, error: null })
    fetchL7Policy(loadbalancerID, listenerID, l7policyID)
      .then((data) => {
        setL7policy({
          ...l7policy,
          isLoading: false,
          item: data.l7policy,
          error: null,
        })
      })
      .catch((error) => {
        setL7policy({ ...l7policy, isLoading: false, error: error })
      })
  }

  useEffect(() => {
    if (loadbalancerID) {
      loadPoolsForSelect()
    }
  }, [loadbalancerID])

  const loadPoolsForSelect = () => {
    Log.debug("fetching pools for select")
    setPools({ ...pools, isLoading: true })
    fetchPoolsForSelect(loadbalancerID)
      .then((data) => {
        setPoolsLoaded(true)
        setPools({ ...pools, isLoading: false, items: data.pools, error: null })
      })
      .catch((error) => {
        setPools({ ...pools, isLoading: false, error: errorMessage(error) })
      })
  }

  useEffect(() => {
    if (l7policy.item) {
      setSelectActionType()
      setSelectRedirectCode()
    }
  }, [l7policy.item])

  const setSelectActionType = () => {
    const selectedOption = actionTypes().find(
      (i) => i.value == (l7policy.item.action || "").trim()
    )
    onSelectAction(selectedOption)
  }

  useEffect(() => {
    if (l7policy.item && poolsLoaded) {
      setSelectRedirectPoolID()
    }
  }, [l7policy.item, poolsLoaded])

  const setSelectRedirectPoolID = () => {
    if (l7policy.item.redirect_pool_id) {
      const selectedOption = pools.items.find(
        (i) => i.value == (l7policy.item.redirect_pool_id || "").trim()
      )
      setRedirectPoolID(selectedOption)
    }
  }

  const setSelectRedirectCode = () => {
    const selectedOption = codeTypes().find(
      (i) => i.value == l7policy.item.redirect_http_code
    )
    setRedirectCode(selectedOption)
  }

  /*
   * Modal stuff
   */
  const [show, setShow] = useState(true)

  const close = (e) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const restoreUrl = () => {
    if (!show) {
      props.history.replace(
        `/loadbalancers/${loadbalancerID}/show?${searchParamsToString(props)}`
      )
    }
  }

  /**
   * Form stuff
   */
  const [formErrors, setFormErrors] = useState(null)
  const [showRedirectHttpCode, setShowRedirectHttpCode] = useState(false)
  const [showRedirectPoolID, setShowRedirectPoolID] = useState(false)
  const [showRedirectPrefix, setShowRedirectPrefix] = useState(false)
  const [showRedirectURL, setShowRedirectURL] = useState(false)

  const showExtraSection = useMemo(
    () =>
      showRedirectHttpCode ||
      showRedirectPoolID ||
      showRedirectPrefix ||
      showRedirectURL,
    [
      showRedirectHttpCode,
      showRedirectPoolID,
      showRedirectPrefix,
      showRedirectURL,
    ]
  )

  const validate = (values) => {
    var redirect_key = ""
    switch (values.action) {
      case "REDIRECT_PREFIX": {
        redirect_key = "redirect_prefix"
        break
      }
      case "REDIRECT_TO_POOL": {
        redirect_key = "redirect_pool_id"
        break
      }
      case "REDIRECT_TO_URL": {
        redirect_key = "redirect_url"
        break
      }
    }

    if (redirect_key.length > 0) {
      return values.name && values.action && values[redirect_key] && true
    }
    return values.name && values.action && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)

    // remove redirect attributes that not belongs to the action type
    const redirectAttr = actionRedirect(values.action).map((attr) => attr.value)
    const filteredValues = Object.keys(values)
      .filter((key) => {
        if (key.includes("redirect_") && !redirectAttr.includes(key)) {
          return false
        }
        return true
      })
      .reduce((obj, key) => {
        obj[key] = values[key]
        return obj
      }, {})

    return updateL7Policy(
      loadbalancerID,
      listenerID,
      l7policyID,
      filteredValues
    )
      .then((data) => {
        addNotice(
          <>
            L7 Policy <b>{data.name}</b> ({data.id}) is being updated.
          </>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistListener(loadbalancerID, listenerID).catch((error) => {})
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onSelectAction = (p) => {
    setActionType(p)
    setShowRedirectHttpCode(false)
    setShowRedirectPoolID(false)
    setShowRedirectPrefix(false)
    setShowRedirectURL(false)

    switch (p.value) {
      case "REDIRECT_PREFIX": {
        setShowRedirectHttpCode(true)
        setShowRedirectPrefix(true)
        break
      }
      case "REDIRECT_TO_POOL": {
        setShowRedirectPoolID(true)
        break
      }
      case "REDIRECT_TO_URL": {
        setShowRedirectHttpCode(true)
        setShowRedirectURL(true)
        break
      }
    }
  }

  const onSelectCode = (p) => {
    setRedirectCode(p)
  }

  const onSelectPoolChange = (p) => {
    setRedirectPoolID(p)
  }

  Log.debug("RENDER edit L7 Policy")
  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      backdrop="static"
      onExited={restoreUrl}
      aria-labelledby="contained-modal-title-lg"
      bsClass="lbaas2 modal"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit L7 Policy</Modal.Title>
      </Modal.Header>

      {l7policy.error ? (
        <Modal.Body>
          <ErrorPage
            headTitle="Edit L7 Policy"
            error={l7policy.error}
            onReload={loadL7policy}
          />
        </Modal.Body>
      ) : (
        <>
          {l7policy.isLoading ? (
            <Modal.Body>
              <span className="spinner" />
            </Modal.Body>
          ) : (
            <Form
              className="form form-horizontal"
              validate={validate}
              onSubmit={onSubmit}
              initialValues={l7policy.item}
              resetForm={false}
            >
              <Modal.Body>
                <p>
                  Policies can be used to REJECT requests or REDIRECT traffic to
                  specific pools or urls. The policy action will be executed
                  when ALL L7 Rules are matched (Rules are combined with an
                  AND). If you need an OR create another Policy with the same
                  action and the needed rules.
                </p>
                <Form.Errors errors={formErrors} />
                <Form.ElementHorizontal label="Name" name="name" required>
                  <Form.Input elementType="input" type="text" name="name" />
                </Form.ElementHorizontal>
                <Form.ElementHorizontal label="Description" name="description">
                  <Form.Input
                    elementType="input"
                    type="text"
                    name="description"
                  />
                </Form.ElementHorizontal>
                <Form.ElementHorizontal label="Position" name="position">
                  <Form.Input
                    elementType="input"
                    type="number"
                    min="1"
                    step="1"
                    name="position"
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    Policies are evaluated in the order as defined by the
                    'position' attribute. The first one that matches a given
                    request will be the one whose action is followed. If no
                    policy matches a given request, then the request is routed
                    to the listener's default pool (if it exists).
                  </span>
                </Form.ElementHorizontal>
                <Form.ElementHorizontal label="Action" name="action" required>
                  <SelectInput
                    name="action"
                    items={actionTypes()}
                    onChange={onSelectAction}
                    value={actionType}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    Will be executed when all L7 Rules are matched.
                  </span>
                </Form.ElementHorizontal>

                <Collapse in={showExtraSection}>
                  <div className="advanced-options-section">
                    {showRedirectHttpCode && (
                      <div className="advanced-options advanced-options-minus-margin">
                        <Form.ElementHorizontal
                          label="Redirect HTTP Code"
                          name="redirect_http_code"
                        >
                          <SelectInput
                            name="redirect_http_code"
                            items={codeTypes()}
                            onChange={onSelectCode}
                            value={redirectCode}
                          />
                          <span className="help-block">
                            <i className="fa fa-info-circle"></i>
                            Requests matching this policy will be redirected to
                            the specified URL or Prefix URL with the HTTP
                            response code. Default is 302.
                          </span>
                        </Form.ElementHorizontal>
                      </div>
                    )}
                    {showRedirectPoolID && (
                      <div className="advanced-options">
                        <Form.ElementHorizontal
                          label="Redirect Pool ID"
                          name="redirect_pool_id"
                          required
                        >
                          <SelectInput
                            name="redirect_pool_id"
                            isLoading={pools.isLoading}
                            items={pools.items}
                            onChange={onSelectPoolChange}
                            value={redirectPoolID}
                          />
                          {pools.error ? (
                            <span className="text-danger">{pools.error}</span>
                          ) : (
                            ""
                          )}
                          <span className="help-block">
                            <i className="fa fa-info-circle"></i>
                            Requests matching this policy will be redirected to
                            the pool with this ID.
                          </span>
                        </Form.ElementHorizontal>
                      </div>
                    )}
                    {showRedirectPrefix && (
                      <div className="advanced-options">
                        <Form.ElementHorizontal
                          label="Redirect Prefix"
                          name="redirect_prefix"
                          required
                        >
                          <Form.Input
                            elementType="input"
                            type="text"
                            name="redirect_prefix"
                          />
                          <span className="help-block">
                            <i className="fa fa-info-circle"></i>
                            Requests matching this policy will be redirected to
                            this Prefix URL.
                          </span>
                        </Form.ElementHorizontal>
                      </div>
                    )}
                    {showRedirectURL && (
                      <div className="advanced-options">
                        <Form.ElementHorizontal
                          label="Redirect Url"
                          name="redirect_url"
                          required
                        >
                          <Form.Input
                            elementType="input"
                            type="text"
                            name="redirect_url"
                          />
                          <span className="help-block">
                            <i className="fa fa-info-circle"></i>
                            Requests matching this policy will be redirected to
                            this URL.
                          </span>
                        </Form.ElementHorizontal>
                      </div>
                    )}
                  </div>
                </Collapse>

                <Form.ElementHorizontal label="Tags" name="tags">
                  <TagsInput
                    name="tags"
                    initValue={l7policy.item && l7policy.item.tags}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    Start a new tag typing a string and hitting the Enter or Tab
                    key.
                  </span>
                </Form.ElementHorizontal>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={close}>Cancel</Button>
                <Form.SubmitButton label="Save" />
              </Modal.Footer>
            </Form>
          )}
        </>
      )}
    </Modal>
  )
}

export default EditL7Policy
