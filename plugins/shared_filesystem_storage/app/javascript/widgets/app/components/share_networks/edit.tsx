import React, { useState, useEffect, useCallback } from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareNetwork {
  id?: string
  name?: string
  description?: string
}

interface History {
  replace: (path: string) => void
}

interface EditShareNetworkFormProps {
  shareNetwork: ShareNetwork | null
  handleSubmit: (values: ShareNetwork) => Promise<void>
  history: History
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditShareNetworkForm: React.FC<EditShareNetworkFormProps> = ({
  shareNetwork,
  handleSubmit,
  history,
}) => {
  const [show, setShow] = useState(shareNetwork != null)

  useEffect(() => {
    setShow(shareNetwork != null)
  }, [shareNetwork])

  const close = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/share-networks"), 300)
  }, [history])

  const onSubmit = useCallback(
    (values: ShareNetwork) => {
      return handleSubmit(values).then(() => close())
    },
    [handleSubmit, close]
  )

  const validate = (values: ShareNetwork) => !!(values.name)

  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit Share Network</Modal.Title>
      </Modal.Header>

      <Form
        validate={validate}
        initialValues={shareNetwork}
        className="form form-horizontal"
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

export default EditShareNetworkForm
