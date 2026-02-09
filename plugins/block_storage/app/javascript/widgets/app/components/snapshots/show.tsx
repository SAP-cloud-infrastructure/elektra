import React, { useState, useEffect } from "react"
// @ts-expect-error no types
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error no types
import { PrettyDate } from "lib/components/pretty_date"

// Types
interface Snapshot {
  id: string
  name: string
  description?: string
  size: number
  status: string
  "os-extended-snapshot-attributes:progress"?: string
  volume_id: string
  volume_name?: string
  metadata?: Record<string, string>
  created_at: string
  updated_at: string
}

interface RowProps {
  label: string
  value?: string | number
  children?: React.ReactNode
}

interface ShowModalProps {
  id: string | null
  snapshot: Snapshot | null
  history: {
    replace: (path: string) => void
    push: (path: string) => void
    goBack: () => void
  }
  loadSnapshot: () => Promise<void>
}

// Row Component
const Row: React.FC<RowProps> = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

// Main Component
const ShowModal: React.FC<ShowModalProps> = ({ id, snapshot, history, loadSnapshot }) => {
  const [show, setShow] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Handle modal visibility based on id prop
  useEffect(() => {
    setShow(id != null)

    // Clear error if snapshot is provided
    if (snapshot != null) {
      setLoadError(null)
    }
  }, [id, snapshot])

  // Load snapshot on mount if not provided
  useEffect(() => {
    if (id != null && !snapshot) {
      loadSnapshot().catch((error) => {
        if (!snapshot) {
          const message = error instanceof Error ? error.message : "An unknown error occurred."
          setLoadError(message)
        }
      })
    }
  }, [id, snapshot, loadSnapshot])

  const restoreUrl = () => {
    if (!show) {
      history.replace("/snapshots")
    }
  }

  const hide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  return (
    <Modal
      show={show}
      onExited={restoreUrl}
      onHide={hide}
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton={true}>
        <Modal.Title id="contained-modal-title-lg">
          Snapshot {snapshot ? snapshot.name : <span className="info-text">{id}</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadError && (
          <div className="text-danger">
            <h4>Could not load snapshot!</h4>
            <p>{loadError}</p>
          </div>
        )}
        {snapshot ? (
          <table className="table no-borders">
            <tbody>
              <Row label="Name" value={snapshot.name} />
              <Row label="ID" value={snapshot.id} />
              <Row label="Description" value={snapshot.description} />
              <Row label="Size (GB)" value={snapshot.size} />
              <Row label="Status" value={snapshot.status} />
              <Row label="Progress" value={snapshot["os-extended-snapshot-attributes:progress"]} />
              <Row label="Source Volume">
                {snapshot.volume_name ? (
                  <>
                    {snapshot.volume_name}
                    <br />
                    <span className="info-text">{snapshot.volume_id}</span>
                  </>
                ) : (
                  snapshot.volume_id
                )}
              </Row>
              <Row label="Metadata">
                {snapshot.metadata &&
                  Object.keys(snapshot.metadata).map((key, index) => (
                    <div key={index}>
                      {key}: {snapshot.metadata![key]}
                    </div>
                  ))}
              </Row>
              <Row label="Created At">
                <PrettyDate date={snapshot.created_at} />
              </Row>
              <Row label="Updated At">
                <PrettyDate date={snapshot.updated_at} />
              </Row>
            </tbody>
          </table>
        ) : (
          <>
            <span className="spinner"></span> Loading...
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={hide} name="close">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowModal
export type { ShowModalProps, Snapshot }
