import React, { useState, useEffect } from "react"
import { Modal, Button, Collapse } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import usePool from "../../lib/hooks/usePool"
import SelectInput from "../shared/SelectInput"
import SelectInputCreatable from "../shared/SelectInputCreatable"
import HelpPopover from "../shared/HelpPopover"
import TagsInput from "../shared/TagsInput"
import { addNotice } from "lib/flashes"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import Log from "../shared/logger"
import { fetchListnersNoDefaultPoolForSelect, fetchSecretsForSelect } from "../../actions/listener"
import {
  errorMessage,
  toManySecretsWarning,
  helpBlockTextForSelect,
  formErrorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import {
  lbAlgorithmTypes,
  poolProtocolTypes,
  POOL_PERSISTENCE_APP_COOKIE,
  poolPersistenceTypes,
  filterListeners,
} from "../../helpers/poolHelper"
import { queryTlsCiphers } from "../../queries/listener"

const NewPool = (props) => {
  const { createPool } = usePool()
  const { persistLoadbalancer } = useLoadbalancer()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [availableListeners, setAvailableListeners] = useState([])
  const [listenersLoading, setListenersLoading] = useState(true)
  const [listeners, setListeners] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [secrets, setSecrets] = useState({
    isLoading: false,
    error: null,
    items: [],
    total: 0,
  })
  const ciphers = queryTlsCiphers()

  useEffect(() => {
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    setLoadbalancerID(lbID)
  }, [])

  useEffect(() => {
    if (loadbalancerID) {
      loadListeners(loadbalancerID)
      loadSecrets(loadbalancerID)
    }
  }, [loadbalancerID])

  useEffect(() => {
    if (!listenersLoading) {
      const selectedProtocol = protocol ? protocol.value : ""
      setAvailableListeners(filterListeners(listeners.items, selectedProtocol))
    }
  }, [listenersLoading])

  // ciphers assignment once loaded
  useEffect(() => {
    if (!ciphers.data) return
    setTlsCiphers(ciphers?.data?.poolDefaultCiphers)
  }, [ciphers.data])

  const loadListeners = (lbID) => {
    return new Promise(() => {
      setListeners({ ...listeners, isLoading: true })
      fetchListnersNoDefaultPoolForSelect(lbID)
        .then((data) => {
          setListeners({
            ...listeners,
            isLoading: false,
            items: data.listeners,
            error: null,
          })
          setListenersLoading(false)
        })
        .catch((error) => {
          setListeners({
            ...listeners,
            isLoading: false,
            error: errorMessage(error),
          })
        })
    })
  }

  const loadSecrets = (lbID) => {
    return new Promise(() => {
      setSecrets({ ...secrets, isLoading: true })
      fetchSecretsForSelect(lbID)
        .then((data) => {
          setSecrets({
            ...secrets,
            isLoading: false,
            items: data.secrets,
            error: null,
            total: data.total,
          })
        })
        .catch((error) => {
          setSecrets({
            ...secrets,
            isLoading: false,
            error: errorMessage(error),
          })
        })
    })
  }

  /**
   * Modal stuff
   */
  const [show, setShow] = useState(true)

  const close = (e) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const restoreUrl = () => {
    if (!show) {
      const params = matchParams(props)
      const lbID = params.loadbalancerID
      props.history.replace(`/loadbalancers/${lbID}/show?${searchParamsToString(props)}`)
    }
  }

  /**
   * Form stuff
   */

  const [formErrors, setFormErrors] = useState(null)
  const [initialValues, setInitialValues] = useState()

  const [protocol, setProtocol] = useState(null)
  const [sessionPersistenceType, setSessionPersistenceType] = useState(null)
  const [listener, setListener] = useState(null)

  const [showTLSSettings, setShowTLSSettings] = useState(false)
  const [showCookieName, setShowCookieName] = useState(false)
  const [tlsCiphers, setTlsCiphers] = useState(null)

  const validate = ({ name, lb_algorithm, protocol }) => {
    return name && lb_algorithm && protocol && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)

    const newValues = { ...values }
    if (!listener) {
      // remove just in case protocol changes and the listener list ist rerendered without choosing again a listener
      delete newValues.listener_id
    }

    // create the persistence object
    // persistenceCookieName will be added only if persistence type is APP_COOKIE
    let persistence = null
    if (sessionPersistenceType) {
      persistence = {}
      persistence.type = sessionPersistenceType.value
      if (sessionPersistenceType.value == POOL_PERSISTENCE_APP_COOKIE) {
        persistence.cookie_name = values.session_persistence_cookie_name
      }
    }
    newValues.session_persistence = persistence

    if (!showTLSSettings) {
      // remove tls attributes just in case they still in context but tls not anymore enabled
      delete newValues.tls_container_ref
      delete newValues.ca_tls_container_ref
    }

    // add manually ciphers since they are not in the context
    if (showTLSSettings && tlsCiphers) {
      // convert to string colon-separated
      newValues.tls_ciphers = tlsCiphers.map((item) => item.value).join(":")
    }

    // get the lb id
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    return createPool(lbID, newValues)
      .then((data) => {
        addNotice(
          <>
            Pool <b>{data.name}</b> ({data.id}) is being created.
          </>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistLoadbalancer(lbID).catch((error) => {})
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onProtocolChanged = (props) => {
    setProtocol(props)
    setListener(null)
    setAvailableListeners(filterListeners(listeners.items, props.value))
  }

  const onPoolPersistenceTypeChanged = (option) => {
    setSessionPersistenceType(option)
    setShowCookieName(option && option.value == POOL_PERSISTENCE_APP_COOKIE)
  }
  const onSelectListenerChange = (props) => {
    setListener(props)
  }
  const onChangedTLS = (e) => {
    if (e && e.target) {
      const value = e.target.checked
      setTimeout(() => setShowTLSSettings(value), 200)
    }
  }

  const onSelectTlsCiphers = (options) => {
    setTlsCiphers(options)
  }

  const protocolTypesFiltered = () => {
    // do not show types disabled
    return poolProtocolTypes().filter((t) => !t.state?.includes("disabled"))
  }

  Log.debug("RENDER new pool")
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
        <Modal.Title id="contained-modal-title-lg">New Pool</Modal.Title>
      </Modal.Header>

      <Form
        className="form form-horizontal"
        validate={validate}
        onSubmit={onSubmit}
        initialValues={initialValues}
        resetForm={false}
      >
        <Modal.Body>
          <div className="bs-callout bs-callout-warning bs-callout-emphasize">
            <h4>Switched to using PKCS12 for TLS Term certs (New in API version 2.8)</h4>
            <p>
              For pools with TLS encryption now use the URI of the Key Manager service secret containing a PKCS12 format
              certificate/key bundle.
            </p>
            <p>
              Please see following examples for creating certs with PKCS12 format:{" "}
              <a
                href="https://github.com/openstack/octavia/blob/master/doc/source/user/guides/basic-cookbook.rst"
                target="_blank"
              >
                Basic Load Balancing Cookbook
              </a>
            </p>
          </div>
          <p>
            Object representing the grouping of members to which the listener forwards client requests. Note that a pool
            is associated with only one listener, but a listener might refer to several pools (and switch between them
            using layer 7 policies).
          </p>
          <Form.Errors errors={formErrors} />

          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input elementType="input" type="text" name="description" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Lb Algorithm" name="lb_algorithm" required>
            <SelectInput name="lb_algorithm" items={lbAlgorithmTypes()} />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The method used for lbaas between members.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Protocol" name="protocol" required>
            <SelectInput
              name="protocol"
              items={protocolTypesFiltered()}
              onChange={onProtocolChanged}
              value={protocol}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The protocol used for routing the traffic to the members.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Session Persistence Type" name="session_persistence_type">
            <SelectInput
              name="session_persistence_type"
              isClearable
              items={poolPersistenceTypes()}
              onChange={onPoolPersistenceTypeChanged}
              value={sessionPersistenceType}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              <span className="help-block-text">
                Defines the method used for session stickiness. Traffic for a client will be send always to the same
                member after the session is established.
              </span>
              <HelpPopover text={helpBlockTextForSelect(poolPersistenceTypes())} />
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showCookieName}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                <Form.ElementHorizontal label="Cookie Name" name="session_persistence_cookie_name" required>
                  <Form.Input elementType="input" type="text" name="session_persistence_cookie_name" />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The name of the HTTP cookie defined by your application. The cookie value will be used for session
                    stickiness.
                  </span>
                </Form.ElementHorizontal>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal label="Default Pool for Listener" name="listener_id">
            {/* dont remove useFromContext because of validation of protocol when changing the listener */}
            <SelectInput
              name="listener_id"
              isClearable
              isLoading={listeners.isLoading}
              items={availableListeners}
              onChange={onSelectListenerChange}
              conditionalPlaceholderText="Please choose the protocol first"
              conditionalPlaceholderCondition={protocol == null}
              value={listener}
            />
            {listeners.error ? <span className="text-danger">{listeners.error}</span> : ""}
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The listener for which this pool is set as the default one.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Use TLS" name="tls_enabled">
            <Form.Input elementType="input" type="checkbox" name="tls_enabled" onClick={onChangedTLS} />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              When true connections to backend member servers will use TLS encryption
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showTLSSettings}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                <div className="row">
                  <div className="col-sm-12">
                    <div className="bs-callout bs-callout-warning bs-callout-emphasize">
                      <p>
                        {" "}
                        TLS-enabled pool can only be attached to a <b>TERMINATED_HTTPS</b> type listener!
                      </p>
                    </div>
                  </div>
                </div>

                <Form.ElementHorizontal label="Certificate Secret" name="tls_container_ref">
                  <SelectInputCreatable
                    name="tls_container_ref"
                    isClearable
                    isLoading={secrets.isLoading}
                    items={secrets.items}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The reference to the secret containing a PKCS12 format certificate/key bundle for TLS client
                    authentication to the member servers.
                  </span>
                  {toManySecretsWarning(secrets.total, secrets.items?.length)}
                  {secrets.error && <span className="text-danger">{secrets.error}</span>}
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="Authentication Secret (CA)" name="ca_tls_container_ref">
                  <SelectInputCreatable
                    name="ca_tls_container_ref"
                    isClearable
                    isLoading={secrets.isLoading}
                    items={secrets.items}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The reference secret containing a PEM format CA certificate bundle.
                  </span>
                  {toManySecretsWarning(secrets.total, secrets.items?.length)}
                  {secrets.error && <span className="text-danger">{secrets.error}</span>}
                </Form.ElementHorizontal>
                <h4>TLS Ciphers Suites</h4>
                <div className="row">
                  <div className="col-sm-12">
                    <div className="bs-callout bs-callout-warning bs-callout-emphasize">
                      <p>
                        This setting is for advanced use cases that require more control over the network configuration
                        of the listener. <br />
                        The following lists the default cipher suites attached to a listener. This should only be
                        changed by expert users who know why they need to make a change. For the majority of scenarios
                        no change is necessary.
                      </p>
                    </div>
                  </div>
                </div>
                <Form.ElementHorizontal label="TLS Ciphers Suites" name="tls_ciphers">
                  <SelectInput
                    name="tls_ciphers"
                    isLoading={ciphers.isLoading}
                    items={ciphers?.data?.allowCiphers || []}
                    onChange={onSelectTlsCiphers}
                    value={tlsCiphers}
                    isMulti
                    useFormContext={false}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The TLS cipher suites.
                  </span>
                  {ciphers.isError && <span className="text-danger">{ciphers.error.message}</span>}
                </Form.ElementHorizontal>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal label="Tags" name="tags">
            <TagsInput name="tags" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              Start a new tag typing a string and hitting the Enter or Tab key.
            </span>
          </Form.ElementHorizontal>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewPool
