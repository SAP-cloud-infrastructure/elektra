/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import useHealthmonitor from "../../lib/hooks/useHealthMonitor"
import usePool from "../../lib/hooks/usePool"
import { Form } from "lib/elektra-form"
import SelectInput from "../shared/SelectInput"
import { addNotice } from "lib/flashes"
import TagsInput from "../shared/TagsInput"
import ErrorPage from "../ErrorPage"
import Log from "../shared/logger"
import {
  formErrorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import { fetchHealthmonitor } from "../../actions/healthMonitor"
import {
  healthMonitorTypes,
  httpMethodRelation,
  expectedCodesRelation,
  urlPathRelation,
  httpMethods,
} from "../../helpers/healthMonitorHelpers"

const EditHealthMonitor = (props) => {
  const { updateHealthmonitor } = useHealthmonitor()
  const { persistPool } = usePool()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [poolID, setPoolID] = useState(null)
  const [healthmonitorID, setHealthmonitorID] = useState(null)
  const [healthmonitor, setHealthmonitor] = useState({
    isLoading: false,
    error: null,
    item: null,
  })
  const [httpMethod, setHttpMethod] = useState(null)
  const [expectedCode, setExpectedCode] = useState(null)

  useEffect(() => {
    // get the lb
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const poolID = params.poolID
    const healthmonitorID = params.healthmonitorID
    setLoadbalancerID(lbID)
    setPoolID(poolID)
    setHealthmonitorID(healthmonitorID)
  }, [])

  useEffect(() => {
    if (healthmonitorID) {
      loadHealthmonitor()
    }
  }, [healthmonitorID])

  const loadHealthmonitor = () => {
    // fetch the healthmonitor to edit
    setHealthmonitor({ ...healthmonitor, isLoading: true })
    fetchHealthmonitor(loadbalancerID, poolID, healthmonitorID)
      .then((data) => {
        setHealthmonitor({
          ...healthmonitor,
          isLoading: false,
          item: data.healthmonitor,
          error: null,
        })
      })
      .catch((error) => {
        setHealthmonitor({ ...healthmonitor, isLoading: false, error: error })
      })
  }

  useEffect(() => {
    if (healthmonitor.item) {
      setShowHttpMethods(httpMethodRelation(healthmonitor.item.type))
      setShowExpectedCodes(expectedCodesRelation(healthmonitor.item.type))
      setShowUrlPath(urlPathRelation(healthmonitor.item.type))
      setSelectHttpMehod()
    }
  }, [healthmonitor.item])

  const setSelectHttpMehod = () => {
    const selectedOption = httpMethods().find(
      (i) => i.value == healthmonitor.item.http_method
    )
    setHttpMethod(selectedOption)
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
      props.history.replace(
        `/loadbalancers/${lbID}/show?${searchParamsToString(props)}`
      )
    }
  }

  /**
   * Form stuff
   */
  const [initialValues, setInitialValues] = useState({})
  const [formErrors, setFormErrors] = useState(null)
  const [showHttpMethods, setShowHttpMethods] = useState(false)
  const [showExpectedCodes, setShowExpectedCodes] = useState(false)
  const [showUrlPath, setShowUrlPath] = useState(false)

  const validate = ({ name, delay }) => {
    return name && delay && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)
    // save the entered values in case of error
    setInitialValues(values)
    // get the lb id and poolId
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const poolID = params.poolID
    const healthmonitorID = params.healthmonitorID

    return updateHealthmonitor(lbID, poolID, healthmonitorID, values)
      .then((data) => {
        addNotice(
          <>
            Health Monitor <b>{data.name}</b> ({data.id}) is being updated.
          </>
        )
        // fetch the pool again containing the new healthmonitor so it gets updated fast
        persistPool(lbID, poolID)
          .then(() => {})
          .catch((error) => {})
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onHealthMonitorTypeChanged = () => {}
  const onHttpMethodsChanged = (options) => {
    setHttpMethod(options)
  }

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
        <Modal.Title id="contained-modal-title-lg">
          Edit Health Monitor
        </Modal.Title>
      </Modal.Header>

      {healthmonitor.error ? (
        <Modal.Body>
          <ErrorPage
            headTitle="Edit Health Monitor"
            error={healthmonitor.error}
            onReload={loadHealthmonitor}
          />
        </Modal.Body>
      ) : (
        <>
          {healthmonitor.isLoading ? (
            <Modal.Body>
              <span className="spinner" />
            </Modal.Body>
          ) : (
            <Form
              className="form form-horizontal"
              validate={validate}
              onSubmit={onSubmit}
              initialValues={healthmonitor.item}
              resetForm={false}
            >
              <Modal.Body>
                <p>
                  Checks the health of the pool members. Unhealthy members will
                  be taken out of traffic schedule. Sets a load balancer to
                  OFFLINE when all members are unhealthy.
                </p>
                <Form.Errors errors={formErrors} />

                <Form.ElementHorizontal label="Name" name="name" required>
                  <Form.Input elementType="input" type="text" name="name" />
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="Type" name="type" required>
                  <SelectInput
                    name="type"
                    items={healthMonitorTypes()}
                    isDisabled
                    onChange={onHealthMonitorTypeChanged}
                    value={
                      healthmonitor.item && {
                        label: healthmonitor.item.type,
                        value: healthmonitor.item.type,
                      }
                    }
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The type of probe sent by the load balancer to verify the
                    member state.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal
                  label="Max Retries"
                  name="max_retries_down"
                >
                  <Form.Input
                    elementType="input"
                    type="number"
                    min="1"
                    max="10"
                    name="max_retries_down"
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The number of allowed check failures before marking the
                    member as OFFLINE. A valid value is from 1 to 10. The
                    default is 3.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="Interval" name="delay" required>
                  <Form.Input
                    elementType="input"
                    type="number"
                    min="1"
                    name="delay"
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The time, in seconds, between sending health check probes to
                    pool members.
                  </span>
                </Form.ElementHorizontal>

                {showHttpMethods && (
                  <Form.ElementHorizontal
                    label="Http method"
                    name="http_method"
                  >
                    <SelectInput
                      name="http_method"
                      items={httpMethods()}
                      onChange={onHttpMethodsChanged}
                      value={httpMethod}
                    />
                    <span className="help-block">
                      <i className="fa fa-info-circle"></i>
                      The HTTP method that the health monitor uses for requests.
                      The default is GET.
                    </span>
                  </Form.ElementHorizontal>
                )}

                {showExpectedCodes && (
                  <Form.ElementHorizontal
                    label="Expected codes"
                    name="expected_codes"
                  >
                    <Form.Input
                      elementType="input"
                      type="text"
                      name="expected_codes"
                    />
                    <span className="help-block">
                      <i className="fa fa-info-circle"></i>
                      The list of HTTP status codes expected in response from
                      the member to declare it healthy. Specify one of the
                      following values:
                      <ul>
                        <li>A single value, such as 200</li>
                        <li>A list, such as 200, 202</li>
                        <li>A range, such as 200-204</li>
                      </ul>
                      The default is 200.
                    </span>
                  </Form.ElementHorizontal>
                )}

                {showUrlPath && (
                  <Form.ElementHorizontal label="Url path" name="url_path">
                    <Form.Input
                      elementType="input"
                      type="text"
                      name="url_path"
                    />
                    <span className="help-block">
                      <i className="fa fa-info-circle"></i>
                      The HTTP URL path of the request sent by the monitor to
                      test the health of a backend member. Must be a string that
                      begins with a forward slash (/). The default URL path is
                      /.
                    </span>
                  </Form.ElementHorizontal>
                )}

                <Form.ElementHorizontal label="Tags" name="tags">
                  <TagsInput
                    name="tags"
                    initValue={healthmonitor.item && healthmonitor.item.tags}
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
                <Form.SubmitButton
                  disabled={!healthmonitor.item}
                  label="Save"
                />
              </Modal.Footer>
            </Form>
          )}
        </>
      )}
    </Modal>
  )
}

export default EditHealthMonitor
