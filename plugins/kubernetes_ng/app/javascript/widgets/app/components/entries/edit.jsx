import React from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import apiClient from "../../apiClient"
import { useGlobalState } from "../StateProvider"
import { useHistory, useLocation, useParams } from "react-router-dom"

const Edit = () => {
  const location = useLocation()
  const history = useHistory()
  const params = useParams()
  const [state, dispatch] = useGlobalState()
  const entry = React.useMemo(
    () => state.entries.items.find((i) => i.id === params.id),
    [state.entries, params.id]
  )
  const [show, setShow] = React.useState(!!entry)
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true
    setShow(!!params.id)
    return () => (mounted.current = false)
  }, [params.id])

  const onSubmit = React.useCallback(
    (values) => {
      apiClient
        .put(`kubernetes_ng-api/entries/${params.id}`, { entry: values })
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
    [params.id, dispatch]
  )

  const close = React.useCallback(() => {
    setShow(false)
  }, [])

  const restoreURL = React.useCallback(() => {
    history.replace(
      location.pathname.replace(/^(\/[^/]*)\/.+\/edit$/, (a, b) => b)
    )
  }, [history, location])

  return (
    <Modal
      show={show}
      onHide={close}
      onExited={restoreURL}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit Entry</Modal.Title>
      </Modal.Header>

      <Form
        onSubmit={onSubmit}
        className="form form-horizontal"
        validate={(values) => true}
        initialValues={entry}
      >
        <Modal.Body>
          <Form.Errors />

          {entry ? (
            <>
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
            </>
          ) : (
            <span>Entry {params.id} not found</span>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default Edit
