import React from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { useHistory, useLocation } from "react-router-dom"
import apiClient from "../../apiClient"
import { useGlobalState } from "../StateProvider"

const New = () => {
  const location = useLocation()
  const history = useHistory()
  const [_, dispatch] = useGlobalState()
  const [show, setShow] = React.useState(true)
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

  const onSubmit = React.useCallback(
    (values) => {
      apiClient
        .post("kubernetes_ng-api/entries", { entry: values })
        .then((response) => response.data)
        .then(
          (item) =>
            mounted.current && dispatch({ type: "@entries/receive", item })
        )
        .then(close)
        .catch(
          (error) =>
            mounted.current &&
            dispatch({ type: "@entries/error", error: error.message })
        )
    },
    [dispatch]
  )

  const close = React.useCallback(() => {
    setShow(false)
  }, [])

  const restoreURL = React.useCallback(
    () => history.replace(location.pathname.replace("/new", "")),
    [history, location]
  )

  const validate = React.useCallback((values) => !!values.name)

  return (
    <Modal
      show={show}
      onHide={close}
      onExited={restoreURL}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Entry</Modal.Title>
      </Modal.Header>

      <Form
        className="form form-horizontal"
        validate={validate}
        onSubmit={onSubmit}
      >
        <Modal.Body>
          <Form.Errors />

          <Form.ElementHorizontal label="Name" name="name">
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input
              elementType="textarea"
              className="text optional form-control"
              name="description"
            />
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

export default New
