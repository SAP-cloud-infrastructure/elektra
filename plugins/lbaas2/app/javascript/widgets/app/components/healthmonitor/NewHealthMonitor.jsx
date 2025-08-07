/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
import useHealthmonitor from "../../lib/hooks/useHealthMonitor"
import usePool from "../../lib/hooks/usePool"
import { Form } from "lib/elektra-form"
import SelectInput from "../shared/SelectInput"
import FormInput from "../shared/FormInput"
import { addNotice } from "lib/flashes"
import TagsInput from "../shared/TagsInput"
import { formErrorMessage, matchParams, searchParamsToString } from "../../helpers/commonHelpers"
import {
  healthMonitorTypes,
  httpMethodRelation,
  expectedCodesRelation,
  urlPathRelation,
  httpMethods,
} from "../../helpers/healthMonitorHelpers"

const NewHealthMonitor = (props) => {
  const { createHealthMonitor } = useHealthmonitor()
  const { persistPool } = usePool()

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
  const [initialValues, setInitialValues] = useState({ max_retries_down: 3 })
  const [formErrors, setFormErrors] = useState(null)
  const [showHttpMethods, setShowHttpMethods] = useState(false)
  const [showExpectedCodes, setShowExpectedCodes] = useState(false)
  const [showUrlPath, setShowUrlPath] = useState(false)

  const validate = ({ name, type, delay }) => {
    return name && type && delay && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)
    // save the entered values in case of error
    setInitialValues(values)
    // get the lb id and poolId
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const poolID = params.poolID

    return createHealthMonitor(lbID, poolID, values)
      .then((data) => {
        addNotice(
          <>
            Health Monitor <b>{data.name}</b> ({data.id}) is being created.
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

  const onHealthMonitorTypeChanged = (options) => {
    setShowHttpMethods(httpMethodRelation(options.value))
    setShowExpectedCodes(expectedCodesRelation(options.value))
    setShowUrlPath(urlPathRelation(options.value))
  }

  const onHttpMethodsChanged = (options) => {}

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
        <Modal.Title id="contained-modal-title-lg">New Health Monitor</Modal.Title>
      </Modal.Header>

      <Form
        className="form form-horizontal"
        validate={validate}
        onSubmit={onSubmit}
        initialValues={initialValues}
        resetForm={false}
      >
        <Modal.Body>
          <p>
            Checks the health of the pool members. Unhealthy members will be taken out of traffic schedule. Sets a load
            balancer to OFFLINE when all members are unhealthy.
          </p>
          <Form.Errors errors={formErrors} />

          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Type" name="type" required>
            <SelectInput name="type" items={healthMonitorTypes()} onChange={onHealthMonitorTypeChanged} />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The type of probe sent by the load balancer to verify the member state.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Max Retries Down" name="max_retries_down">
            <Form.Input elementType="input" type="number" min="1" max="10" name="max_retries_down" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The number of allowed check failures before marking the member as OFFLINE. A valid value is from 1 to 10.
              The default is 3. <b>Note</b>: This parameter differs from the Octavia "Max Retries", which is not
              supported in SAP Cloud Infrastructure environment.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Interval" name="delay" required>
            <Form.Input elementType="input" type="number" min="1" name="delay" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The time, in seconds, between sending health check probes to pool members.
            </span>
          </Form.ElementHorizontal>

          {showHttpMethods && (
            <Form.ElementHorizontal label="Http method" name="http_method">
              <SelectInput
                name="http_method"
                items={httpMethods()}
                onChange={onHttpMethodsChanged}
                value={{ label: "GET", value: "GET" }}
              />
              <span className="help-block">
                <i className="fa fa-info-circle"></i>
                The HTTP method that the health monitor uses for requests. The default is GET.
              </span>
            </Form.ElementHorizontal>
          )}

          {showExpectedCodes && (
            <Form.ElementHorizontal label="Expected codes" name="expected_codes">
              {/* We need here the shared FormInput because of need to set a default value */}
              <FormInput type="text" name="expected_codes" defaultValue="200" />
              <span className="help-block">
                <i className="fa fa-info-circle"></i>
                The list of HTTP status codes expected in response from the member to declare it healthy. Specify one of
                the following values:
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
              {/* We need here the shared FormInput because of need to set a default value */}
              <FormInput type="text" name="url_path" defaultValue="/" />
              <span className="help-block">
                <i className="fa fa-info-circle"></i>
                The HTTP URL path of the request sent by the monitor to test the health of a backend member. Must be a
                string that begins with a forward slash (/). The default URL path is /.
              </span>
            </Form.ElementHorizontal>
          )}

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

export default NewHealthMonitor
