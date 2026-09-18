import React, { useState, useEffect } from "react"
import { Button, Collapse } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import usePool from "../../lib/hooks/usePool"
import ErrorPage from "../ErrorPage"
import { Form } from "lib/elektra-form"
import SelectInput from "../shared/SelectInput"
import SelectInputCreatable from "../shared/SelectInputCreatable"
import HelpPopover from "../shared/HelpPopover"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import TagsInput from "../shared/TagsInput"
import { addNotice } from "lib/flashes"
import Log from "../shared/logger"
import {
  fetchListnersForSelect,
  fetchSecretsForSelect,
} from "../../actions/listener"
import {
  errorMessage,
  secretRefLabel,
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
  POOL_PERSISTENCE_SOURCE_IP,
} from "../../helpers/poolHelper"
import { fetchPool } from "../../actions/pool"
import { queryTlsCiphers } from "../../queries/listener"

const EditPool = (props) => {
  const { updatePool } = usePool()
  const { persistLoadbalancer } = useLoadbalancer()

  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [poolID, setPoolID] = useState(null)
  const [availableListeners, setAvailableListeners] = useState([])
  const [availableListenersLoading, setAvailableListenersLoading] =
    useState(true)
  const [listenersLoaded, setListenersLoaded] = useState(false)

  const [lbAlgorithm, setLbAlgorithm] = useState(null)
  const [protocol, setProtocol] = useState(null)
  const [sessionPersistenceType, setSessionPersistenceType] = useState(null)
  const [listener, setListener] = useState(null)
  const [certificateContainer, setCertificateContainer] = useState(null)
  const [authenticationContainer, setAuthenticationContainer] = useState(null)
  const ciphers = queryTlsCiphers()

  const [pool, setPool] = useState({
    isLoading: false,
    error: null,
    item: null,
  })
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

  useEffect(() => {
    // get the lb
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const plID = params.poolID
    setLoadbalancerID(lbID)
    setPoolID(plID)
  }, [])

  useEffect(() => {
    if (poolID) {
      loadPool()
      loadListeners()
      loadSecrets()
    }
  }, [poolID])

  const loadPool = () => {
    Log.debug("fetching pool to edit")
    setPool({ ...pool, isLoading: true, error: null })
    fetchPool(loadbalancerID, poolID)
      .then((data) => {
        setSelectedLbAlgorithm(data.pool.lb_algorithm)
        setSelectedProtocol(data.pool.protocol)
        setSelectedSessionPersistence(data.pool)
        setSelectedUseTLS(data.pool.tls_enabled)
        setPool({ ...pool, isLoading: false, item: data.pool, error: null })
      })
      .catch((error) => {
        setPool({ ...pool, isLoading: false, error: error })
      })
  }

  const loadListeners = () => {
    Log.debug("fetching listeners to pool edit")
    setListeners({ ...listeners, isLoading: true })
    fetchListnersForSelect(loadbalancerID)
      .then((data) => {
        setListeners({
          ...listeners,
          isLoading: false,
          items: data.listeners,
          error: null,
        })
        setListenersLoaded(true)
      })
      .catch((error) => {
        setListeners({
          ...listeners,
          isLoading: false,
          error: errorMessage(error),
        })
      })
  }

  const loadSecrets = () => {
    setSecrets({ ...secrets, isLoading: true })
    fetchSecretsForSelect(loadbalancerID)
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
  }

  useEffect(() => {
    if (protocol && protocol.value) {
      const selectedProtocol = protocol ? protocol.value : ""
      const filteredListeners = filterListeners(
        listeners.items,
        selectedProtocol
      )
      setAvailableListeners(filteredListeners)
      setAvailableListenersLoading(false)
      if (pool.item && pool.item.listeners) {
        setSelectedListener(filteredListeners, pool.item.listeners)
      }
    }
  }, [listenersLoaded, protocol, pool])

  useEffect(() => {
    if (!pool.item) return
    setSelectedCertificateContainer(pool.item?.tls_container_ref)
    setSelectedAuthenticationContainer(pool.item?.ca_tls_container_ref)
    setSelectedTlsCiphers()
  }, [pool.item])

  const setSelectedLbAlgorithm = (selectedLbAlgorithm) => {
    const selectedOption = lbAlgorithmTypes().find(
      (i) => i.value == (selectedLbAlgorithm || "").trim()
    )
    setLbAlgorithm(selectedOption)
  }

  const setSelectedProtocol = (selectedProtocol) => {
    const selectedOption = poolProtocolTypes().find(
      (i) => i.value == (selectedProtocol || "").trim()
    )
    setProtocol(selectedOption)
  }

  const setSelectedSessionPersistence = (pool) => {
    const selectedPersistenceType = pool.session_persistence
    if (selectedPersistenceType && selectedPersistenceType.type) {
      const selectedOption = poolPersistenceTypes().find(
        (i) => i.value == (selectedPersistenceType.type || "").trim()
      )
      setSessionPersistenceType(selectedOption)
      setShowPersistenceCookieName(selectedOption)
      pool.session_persistence_type = selectedPersistenceType.type
    }
    if (selectedPersistenceType && selectedPersistenceType.cookie_name) {
      // Need to be just set per context since this is a plain input field and no value attribute available
      pool.session_persistence_cookie_name = selectedPersistenceType.cookie_name
    }
  }

  const setSelectedListener = (filteredListeners, selectedListeners) => {
    const selectedListenerKeys = selectedListeners.map((i) => i.id)
    const selectedOptions = filteredListeners.filter((i) =>
      selectedListenerKeys.includes(i.value)
    )
    setListener(selectedOptions)
  }

  const setSelectedUseTLS = (selectedUseTLS) => {
    setShowTLSSettings(selectedUseTLS)
  }

  const setSelectedCertificateContainer = (selectedCertificateContainer) => {
    // there is no more mapping between the selected secret and the options displayed
    // in the dropdown. Since it is not possible to display all secrets we show the
    // selected secrets directly on the field.
    if (selectedCertificateContainer)
      setCertificateContainer({
        label: secretRefLabel(selectedCertificateContainer),
        value: selectedCertificateContainer,
      })
  }

  const setSelectedAuthenticationContainer = (
    selectedAuthenticationContainer
  ) => {
    // there is no more mapping between the selected secret and the options displayed
    // in the dropdown. Since it is not possible to display all secrets we show the
    // selected secrets directly on the field.
    if (selectedAuthenticationContainer)
      setAuthenticationContainer({
        label: secretRefLabel(selectedAuthenticationContainer),
        value: selectedAuthenticationContainer,
      })
  }

  const setShowPersistenceCookieName = (option) => {
    setShowCookieName(option && option.value == POOL_PERSISTENCE_APP_COOKIE)
  }

  // initial assigment of the ciphers
  const setSelectedTlsCiphers = () => {
    const selectedTlsCiphers = pool.item?.tls_ciphers
    // split string colon separated to select options
    if (selectedTlsCiphers && typeof selectedTlsCiphers == "string") {
      const options = selectedTlsCiphers
        .split(":")
        .map((item) => ({ value: item, label: item }))
      setTlsCiphers(options)
    }
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
      // get the lb
      const params = matchParams(props)
      const lbID = params.loadbalancerID
      props.history.replace(
        `/loadbalancers/${lbID}/show?${searchParamsToString(props)}`
      )
    }
  }

  /**
   * Form stuff
   */
  const [formErrors, setFormErrors] = useState(null)
  const [protocols, setProtocols] = useState(poolProtocolTypes())
  const [showCookieName, setShowCookieName] = useState(false)
  const [showTLSSettings, setShowTLSSettings] = useState(false)
  const [tlsCiphers, setTlsCiphers] = useState(null)

  const validate = ({
    name,
    description,
    lb_algorithm,
    session_persistence_type,
    session_persistence_cookie_name,
    listener_id,
    tls_enabled,
    tls_container_ref,
    ca_tls_container_ref,
    tags,
  }) => {
    return name && lb_algorithm && true
  }

  const onSubmit = (values) => {
    const newValues = { ...values }

    // start with a null session persistence just in case the user have removed the persistence session
    let persistence = null
    if (sessionPersistenceType) {
      // if the persistence type is the same as the one in the context and the type is SOURCE_IP then we keep the persistence object because of extra attributes like persistence_timeout and persistence_granularity which apply just for SOURCE_IP
      if (
        newValues?.session_persistence?.type ===
          sessionPersistenceType?.value &&
        newValues?.session_persistence?.type === POOL_PERSISTENCE_SOURCE_IP
      ) {
        persistence = { ...newValues.session_persistence }
      } else {
        persistence = {}
        // update the type
        persistence.type = sessionPersistenceType.value
        // update the cookie_name if the persistence type is not APP_COOKIE
        if (persistence.type === POOL_PERSISTENCE_APP_COOKIE) {
          persistence.cookie_name = values.session_persistence_cookie_name
        }
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

    setFormErrors(null)
    return updatePool(loadbalancerID, poolID, newValues)
      .then((data) => {
        addNotice(
          <>
            Pool <b>{data.name}</b> ({data.id}) is being updated.
          </>
        )
        // fetch the lb again containing the new listener so it gets updated fast
        persistLoadbalancer(loadbalancerID).catch((error) => {})
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onLbAlgorithmChange = (option) => {
    setLbAlgorithm(option)
  }
  const onPoolPersistenceTypeChanged = (option) => {
    setSessionPersistenceType(option)
    setShowPersistenceCookieName(option)
  }
  const onChangedTLS = (e) => {
    if (e && e.target) {
      const value = e.target.checked
      setTimeout(() => setShowTLSSettings(value), 200)
    }
  }
  const onCertificateContainerChange = (option) => {
    setCertificateContainer(option)
  }
  const onAuthenticationContainerChange = (option) => {
    setAuthenticationContainer(option)
  }

  const onSelectTlsCiphers = (options) => {
    setTlsCiphers(options)
  }

  Log.debug("RENDER edit pool")
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
        <Modal.Title id="contained-modal-title-lg">Edit Pool</Modal.Title>
      </Modal.Header>

      {pool.error ? (
        <Modal.Body>
          <ErrorPage
            headTitle="Edit Pool"
            error={pool.error}
            onReload={loadPool}
          />
        </Modal.Body>
      ) : (
        <>
          {pool.isLoading ? (
            <Modal.Body>
              <span className="spinner" />
            </Modal.Body>
          ) : (
            <Form
              className="form form-horizontal"
              validate={validate}
              onSubmit={onSubmit}
              initialValues={pool.item}
              resetForm={false}
            >
              <Modal.Body>
                <div className="bs-callout bs-callout-warning bs-callout-emphasize">
                  <h4>
                    Switched to using PKCS12 for TLS Term certs (New in API
                    version 2.8)
                  </h4>
                  <p>
                    For pools with TLS encryption now use the URI of the Key
                    Manager service secret containing a PKCS12 format
                    certificate/key bundle.
                  </p>
                  <p>
                    <b>
                      Please consider exchanging the secret containers for
                      secrets and use PKCS12 format certificate/key bundle for
                      the for TLS client authentication as soon as possible!
                    </b>
                  </p>
                  <p>
                    Please see following examples for creating certs with PKCS12
                    format:{" "}
                    <a
                      href="https://github.com/openstack/octavia/blob/master/doc/source/user/guides/basic-cookbook.rst"
                      target="_blank"
                    >
                      Basic Load Balancing Cookbook
                    </a>
                  </p>
                </div>
                <p>
                  Object representing the grouping of members to which the
                  listener forwards client requests. Note that a pool is
                  associated with only one listener, but a listener might refer
                  to several pools (and switch between them using layer 7
                  policies).
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

                <Form.ElementHorizontal
                  label="Lb Algorithm"
                  name="lb_algorithm"
                  required
                >
                  <SelectInput
                    name="lb_algorithm"
                    items={lbAlgorithmTypes()}
                    onChange={onLbAlgorithmChange}
                    value={lbAlgorithm}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The method used for lbaas between members.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal
                  label="Protocol"
                  name="protocol"
                  required
                >
                  <SelectInput
                    name="protocol"
                    items={protocols}
                    value={protocol}
                    isDisabled={true}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The protocol used for routing the traffic to the members.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal
                  label="Session Persistence Type"
                  name="session_persistence_type"
                >
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
                      Defines the method used for session stickiness. Traffic
                      for a client will be send always to the same member after
                      the session is established.
                    </span>
                    <HelpPopover
                      text={helpBlockTextForSelect(poolPersistenceTypes())}
                    />
                  </span>
                </Form.ElementHorizontal>

                <Collapse in={showCookieName}>
                  <div className="advanced-options-section">
                    <div className="advanced-options">
                      <Form.ElementHorizontal
                        label="Cookie Name"
                        name="session_persistence_cookie_name"
                        required
                      >
                        <Form.Input
                          elementType="input"
                          type="text"
                          name="session_persistence_cookie_name"
                        />
                        <span className="help-block">
                          <i className="fa fa-info-circle"></i>
                          The name of the HTTP cookie defined by your
                          application. The cookie value will be used for session
                          stickiness.
                        </span>
                      </Form.ElementHorizontal>
                    </div>
                  </div>
                </Collapse>

                <Form.ElementHorizontal
                  label="Assigned to Listeners"
                  name="listener_id"
                >
                  <SelectInput
                    name="listener_id"
                    isClearable
                    isMulti
                    isLoading={availableListenersLoading}
                    items={availableListeners}
                    value={listener}
                    isDisabled
                  />
                  {listeners.error ? (
                    <span className="text-danger">{listeners.error}</span>
                  ) : (
                    ""
                  )}
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The listener for which this pool is set as the default one.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="Use TLS" name="tls_enabled">
                  <Form.Input
                    elementType="input"
                    type="checkbox"
                    name="tls_enabled"
                    onClick={onChangedTLS}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    When true connections to backend member servers will use TLS
                    encryption
                  </span>
                </Form.ElementHorizontal>

                <Collapse in={showTLSSettings}>
                  <div className="advanced-options-section">
                    <div className="advanced-options">
                      <Form.ElementHorizontal
                        label="Certificate Secret"
                        name="tls_container_ref"
                      >
                        <SelectInputCreatable
                          name="tls_container_ref"
                          isClearable
                          isLoading={secrets.isLoading}
                          items={secrets.items}
                          onChange={onCertificateContainerChange}
                          value={certificateContainer}
                        />
                        <span className="help-block">
                          <i className="fa fa-info-circle"></i>
                          The reference to the secret containing a PKCS12 format
                          certificate/key bundle for TLS client authentication
                          to the member servers.
                        </span>
                        {toManySecretsWarning(
                          secrets.total,
                          secrets.items?.length
                        )}
                        {secrets.error && (
                          <span className="text-danger">{secrets.error}</span>
                        )}
                      </Form.ElementHorizontal>

                      <Form.ElementHorizontal
                        label="Authentication Secret (CA)"
                        name="ca_tls_container_ref"
                      >
                        <SelectInputCreatable
                          name="ca_tls_container_ref"
                          isClearable
                          isLoading={secrets.isLoading}
                          items={secrets.items}
                          onChange={onAuthenticationContainerChange}
                          value={authenticationContainer}
                        />
                        <span className="help-block">
                          <i className="fa fa-info-circle"></i>
                          The reference secret containing a PEM format CA
                          certificate bundle.
                        </span>
                        {toManySecretsWarning(
                          secrets.total,
                          secrets.items?.length
                        )}
                        {secrets.error && (
                          <span className="text-danger">{secrets.error}</span>
                        )}
                      </Form.ElementHorizontal>

                      <h4>TLS Ciphers Suites</h4>
                      <div className="row">
                        <div className="col-sm-12">
                          <div className="bs-callout bs-callout-warning bs-callout-emphasize">
                            <p>
                              This setting is for advanced use cases that
                              require more control over the network
                              configuration of the listener. <br />
                              The following lists the default cipher suites
                              attached to a listener. This should only be
                              changed by expert users who know why they need to
                              make a change. For the majority of scenarios no
                              change is necessary.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Form.ElementHorizontal
                        label="TLS Ciphers Suites"
                        name="tls_ciphers"
                      >
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
                        {ciphers.isError && (
                          <span className="text-danger">
                            {ciphers.error.message}
                          </span>
                        )}
                      </Form.ElementHorizontal>
                    </div>
                  </div>
                </Collapse>

                <Form.ElementHorizontal label="Tags" name="tags">
                  <TagsInput
                    name="tags"
                    initValue={pool.item && pool.item.tags}
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

export default EditPool
