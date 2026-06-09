import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
import ErrorMessageItem from "./item"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorMessage {
  id?: string
  message_level?: string
  user_message?: string
  created_at?: string
}

interface ErrorMessagesState {
  isFetching: boolean
  items: ErrorMessage[]
}

interface Match {
  params: { type?: string }
}

interface History {
  replace: (path: string) => void
}

interface ErrorMessageListProps {
  errorMessages?: ErrorMessagesState
  loadErrorMessagesOnce: () => void
  match?: Match
  history: History
}

// ─── Component ────────────────────────────────────────────────────────────────

const ErrorMessageList: React.FC<ErrorMessageListProps> = ({
  errorMessages,
  loadErrorMessagesOnce,
  match,
  history,
}) => {
  const [show, setShow] = useState(true)

  useEffect(() => {
    loadErrorMessagesOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const restoreUrl = () => {
    if (!show) {
      const type = match?.params?.type
      history.replace(type || "shares")
    }
  }

  return (
    <Modal
      show={show}
      onExited={restoreUrl}
      onHide={hide}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Error Log</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!errorMessages || errorMessages.isFetching ? (
          <div>
            <span className="spinner" />
            Loading...
          </div>
        ) : (
          <table className="table error-messages">
            <thead>
              <tr>
                <th>Level</th>
                <th>Error</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {errorMessages.items.length === 0 && (
                <tr>
                  <td colSpan={3}>No errors found.</td>
                </tr>
              )}
              {errorMessages.items.map((errorMessage, index) => (
                <ErrorMessageItem key={index} errorMessage={errorMessage} />
              ))}
            </tbody>
          </table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={hide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ErrorMessageList
