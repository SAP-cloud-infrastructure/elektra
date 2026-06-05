import { useState, useCallback } from "react"
import { Modal, Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useDispatch } from "../../stateProvider"
import * as apiClient from "../../apiClient"
import { Form } from "lib/elektra-form"
import React from "react"

const FormBody = ({ values }) => (
  <Modal.Body>
    <Form.Errors />

    <Form.ElementHorizontal label="Name" name="name" required>
      <Form.Input elementType="input" type="text" name="name" />
    </Form.ElementHorizontal>
  </Modal.Body>
)

const New = () => {
  const [show, setShow] = useState(true)
  const history = useHistory()
  const dispatch = useDispatch()

  const validate = useCallback((values) => values.name && true, [])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/")
  }, [])

  const onSubmit = useCallback(
    (values) => {
      return apiClient
        .post("../../bgp-vpns", { name: values.name })
        .then((data) => {
          dispatch("bgpvpns", "add", { name: "items", item: data.bgpvpn })
          close()
        })
        .catch((error) => {
          // make it readable by FormErrors
          // FormErrors expects an object with errors property
          throw { errors: error.message }
        })
    },
    [close]
  )

  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      backdrop="static"
      onExited={back}
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New BGP VPN</Modal.Title>
      </Modal.Header>

      <Form
        className="form form-horizontal"
        validate={validate}
        onSubmit={onSubmit}
        initialValues={{}}
      >
        <FormBody />

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default New
