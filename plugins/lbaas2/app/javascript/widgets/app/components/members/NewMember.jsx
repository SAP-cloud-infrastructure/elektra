import React, { useState, useEffect, useRef } from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import useMember from "../../lib/hooks/useMember"
import Log from "../shared/logger"
import { FormStateProvider } from "./FormState"
import NewMemberForm from "./NewMemberForm"
import SaveButton from "../shared/SaveButton"
import ExistingMembersDropDown from "./ExistingMembersDropDown"
import {
  errorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"

const NewMember = (props) => {
  const { fetchServers } = useMember()
  const [servers, setServers] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [poolID, setPoolID] = useState(null)
  const [show, setShow] = useState(true)

  useEffect(() => {
    // get the lb
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const plID = params.poolID
    setLoadbalancerID(lbID)
    setPoolID(plID)
  }, [])

  useEffect(() => {
    if (!loadbalancerID && !poolID) return
    Log.debug("fetching servers for select")
    // get servers for the select
    setServers({ ...servers, isLoading: true })
    fetchServers(loadbalancerID, poolID)
      .then((data) => {
        setServers({
          ...servers,
          isLoading: false,
          items: data.servers,
          error: null,
        })
      })
      .catch((error) => {
        setServers({
          ...servers,
          isLoading: false,
          error: errorMessage(error),
        })
      })
  }, [loadbalancerID, poolID])

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

  const memberFormRef = useRef()
  const onSaveClicked = () => {
    memberFormRef.current.onSubmit()
  }

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const onFormCallback = ({ isSubmitting, isValid, shouldClose }) => {
    setFormSubmitting(isSubmitting || false)
    setIsFormValid(isValid || false)
    if (shouldClose) close()
  }

  // enforceFocus={false} needed so the clipboard.js library works on bootstrap modals
  // https://github.com/zenorocha/clipboard.js/issues/388
  // https://github.com/twbs/bootstrap/issues/19971
  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      backdrop="static"
      onExited={restoreUrl}
      aria-labelledby="contained-modal-title-lg"
      bsClass="lbaas2 modal"
      enforceFocus={false}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Member</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          Members are servers that serve traffic behind a load balancer. Each
          member is specified by the IP address and port that it uses to serve
          traffic.
        </p>

        <FormStateProvider>
          <NewMemberForm
            loadbalancerID={loadbalancerID}
            poolID={poolID}
            servers={servers}
            onFormCallback={onFormCallback}
            ref={memberFormRef}
          />
        </FormStateProvider>

        <ExistingMembersDropDown props={props} poolID={poolID} />
      </Modal.Body>
      <Modal.Footer>
        <Button disabled={formSubmitting} onClick={close}>
          Cancel
        </Button>
        <SaveButton
          disabled={formSubmitting || !isFormValid}
          showTooltip={!isFormValid}
          text={<>{formSubmitting && <span className="spinner" />}Save</>}
          tooltipText="Please check validation and required fields"
          callback={onSaveClicked}
        />
      </Modal.Footer>
    </Modal>
  )
}

export default NewMember
