import React, { useState, useEffect } from "react"
import { Button, Collapse } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import {
  errorMessage,
  secretRefLabel,
  toManySecretsWarning,
  helpBlockTextForSelect,
  formErrorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import { fetchListener } from "../../actions/listener"
import { Form } from "lib/elektra-form"
import ErrorPage from "../ErrorPage"
import CidrsInput from "./CidrsInput"
import useListener from "../../lib/hooks/useListener"
import { addNotice } from "lib/flashes"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"

const AllowedCidrs = (props) => {
  const { updateListener } = useListener()
  const { persistLoadbalancer } = useLoadbalancer()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [listenerID, setListenerID] = useState(null)
  const [listener, setListener] = useState({
    isLoading: false,
    error: null,
    item: null,
  })
  const [formErrors, setFormErrors] = useState(null)

  useEffect(() => {
    // get the lb
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const ltID = params.listenerID
    setLoadbalancerID(lbID)
    setListenerID(ltID)
  }, [])

  useEffect(() => {
    if (listenerID) {
      loadListener()
    }
  }, [listenerID])

  const loadListener = () => {
    // fetch the listener to edit
    setListener({ ...listener, isLoading: true, error: null })
    fetchListener(loadbalancerID, listenerID)
      .then((data) => {
        setListener({
          ...listener,
          isLoading: false,
          item: data.listener,
          error: null,
        })
      })
      .catch((error) => {
        setListener({ ...listener, isLoading: false, error: error })
      })
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

  const onSubmit = (values) => {
    return updateListener(loadbalancerID, listenerID, values)
      .then((data) => {
        addNotice(
          <>
            Listener <b>{data.name}</b> ({data.id}) is being updated.
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
        <Modal.Title id="contained-modal-title-lg">Allowed CIDRs</Modal.Title>
      </Modal.Header>

      {listener.error ? (
        <Modal.Body>
          <ErrorPage
            headTitle="Allowed CIDRs"
            error={listener.error}
            onReload={loadListener}
          />
        </Modal.Body>
      ) : (
        <>
          {listener.isLoading ? (
            <Modal.Body>
              <span className="spinner" />
            </Modal.Body>
          ) : (
            <Form
              className="form form-horizontal"
              validate={() => true}
              onSubmit={onSubmit}
              initialValues={listener.item}
              resetForm={false}
            >
              <Modal.Body>
                <p>
                  A list of IPv4, IPv6 or mix of both CIDRs. The default is all
                  allowed. When a list of CIDRs is provided, the default
                  switches to deny all.
                </p>
                <Form.Errors errors={formErrors} />
                <Form.ElementHorizontal
                  label="Allowed CIDRs"
                  name="allowed_cidrs"
                >
                  <CidrsInput name="allowed_cidrs" />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    Start a new CIDR typing a string and hitting the Enter or
                    Tab key.
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

export default AllowedCidrs
