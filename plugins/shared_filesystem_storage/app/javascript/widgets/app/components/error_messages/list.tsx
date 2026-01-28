import React, { useState, useEffect } from "react"
// @ts-expect-error - no types available
import { DefeatableLink } from "lib/components/defeatable_link"
// @ts-expect-error - no types available
import { policy } from "lib/policy"
import { Modal, Button } from "react-bootstrap"
import ErrorMessageItem from "./item"

interface ErrorMessage {
  id: string
  message: string
  level: string
  created_at: string
  [key: string]: unknown
}

interface ErrorMessagesState {
  items: ErrorMessage[]
  isFetching: boolean
}

interface ErrorMessageListProps {
  errorMessages?: ErrorMessagesState
  loadErrorMessagesOnce: () => void
  match?: {
    params: {
      type?: string
    }
  }
  history: {
    replace: (path: string) => void
  }
}

const ErrorMessageList: React.FC<ErrorMessageListProps> = ({
  errorMessages,
  loadErrorMessagesOnce,
  match,
  history,
}) => {
  const [show, setShow] = useState(true)

  // Load dependencies on mount and when they change
  useEffect(() => {
    loadErrorMessagesOnce()
  }, [loadErrorMessagesOnce])

  const restoreUrl = () => {
    const type = match && match.params.type
    if (!show) history.replace(type || "shares")
  }

  const hide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  return (
    <Modal show={show} onExited={restoreUrl} onHide={hide} size="lg" aria-labelledby="contained-modal-title-lg">
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
                <ErrorMessageItem key={errorMessage.id} errorMessage={errorMessage} />
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
