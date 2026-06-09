import React, { useState, useEffect, useCallback } from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Share {
  id?: string
  name?: string
  description?: string
}

interface History {
  replace: (path: string) => void
}

interface Match {
  params: { parent: string }
}

interface EditShareFormProps {
  share: Share | null
  handleSubmit: (values: Share) => Promise<void>
  history: History
  match: Match
  loadShareTypesOnce: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditShareForm: React.FC<EditShareFormProps> = ({
  share,
  handleSubmit,
  history,
  match,
  loadShareTypesOnce,
}) => {
  const [show, setShow] = useState(share != null)

  useEffect(() => {
    loadShareTypesOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setShow(share != null)
  }, [share])

  const close = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) e.preventDefault()
      setShow(false)
      setTimeout(() => history.replace(`/${match.params.parent}`), 300)
    },
    [history, match]
  )

  const onSubmit = useCallback(
    (values: Share) => {
      return handleSubmit(values).then(() => close())
    },
    [handleSubmit, close]
  )

  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit Share</Modal.Title>
      </Modal.Header>

      <Form
        onSubmit={onSubmit}
        className="form form-horizontal"
        validate={() => true}
        initialValues={share}
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

export default EditShareForm
