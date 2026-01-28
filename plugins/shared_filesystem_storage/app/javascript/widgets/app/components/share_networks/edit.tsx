import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - lib/elektra-form has no TypeScript definitions
import { Form } from "lib/elektra-form"

interface ShareNetwork {
  id: string
  name?: string
  description?: string
}

interface EditShareNetworkFormProps {
  shareNetwork: ShareNetwork | null
  history: {
    replace: (path: string) => void
  }
  handleSubmit: (values: ShareNetwork) => Promise<void>
}

const EditShareNetworkForm: React.FC<EditShareNetworkFormProps> = ({ shareNetwork, history, handleSubmit }) => {
  const [show, setShow] = useState(shareNetwork !== null)

  useEffect(() => {
    setShow(shareNetwork !== null)
  }, [shareNetwork])

  const validate = (values: ShareNetwork): boolean => {
    return Boolean(values.name)
  }

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/share-networks"), 300)
  }

  const onSubmit = (values: ShareNetwork) => {
    return handleSubmit(values).then(() => close())
  }

  return (
    <Modal show={show} onHide={close} size="lg" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit Share Network</Modal.Title>
      </Modal.Header>

      <Form validate={validate} initialValues={shareNetwork} className="form form-horizontal" onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Errors />

          <Form.ElementHorizontal label="Name" name="name">
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input elementType="textarea" className="text optional form-control" name="description" />
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
