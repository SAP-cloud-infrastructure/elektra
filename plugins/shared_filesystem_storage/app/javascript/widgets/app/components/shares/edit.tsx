import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - lib/elektra-form has no TypeScript definitions
import { Form } from "lib/elektra-form"

interface Share {
  id: string
  name?: string
  description?: string
}

interface EditShareFormProps {
  share: Share | null
  match: {
    params: {
      parent: string
    }
  }
  history: {
    replace: (path: string) => void
  }
  handleSubmit: (values: Share) => Promise<void>
  loadShareTypesOnce: () => void
}

const EditShareForm: React.FC<EditShareFormProps> = ({ share, match, history, handleSubmit, loadShareTypesOnce }) => {
  const [show, setShow] = useState(share !== null)

  useEffect(() => {
    loadShareTypesOnce()
  }, [loadShareTypesOnce])

  useEffect(() => {
    setShow(share !== null)
  }, [share])

  const close = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setShow(false)
    setTimeout(() => history.replace(`/${match.params.parent}`), 300)
  }

  const onSubmit = (values: Share) => {
    return handleSubmit(values).then(() => close())
  }

  return (
    <Modal show={show} onHide={close} size="lg" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit Share</Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit} className="form form-horizontal" validate={() => true} initialValues={share}>
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

export default EditShareForm
