import React, { useState, useEffect } from "react"
// @ts-expect-error - react-bootstrap v0.33.1 types are incomplete
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { PrettyDate } from "lib/components/pretty_date"

// Types
interface VolumeAttachment {
  attachment_id: string
  server_id: string
  server_name?: string
  device: string
  attached_at: string
}

interface Volume {
  id: string
  name: string
  description?: string
  size: number
  volume_type: string
  availability_zone: string
  status: string
  replication_status?: string
  metadata?: Record<string, string>
  user_name?: string
  user_id: string
  bootable: boolean | string
  encrypted: boolean | string
  multiattach: boolean | string
  snapshot_id?: string
  source_volid?: string
  consistencygroup_id?: string
  created_at: string
  updated_at: string
  attachments?: VolumeAttachment[]
  volume_image_metadata?: Record<string, string | number | boolean>
}

interface RowProps {
  label: string
  value?: string | number | boolean
  children?: React.ReactNode
}

interface ShowModalProps {
  id: string | null
  volume: Volume | null
  history: {
    replace: (path: string) => void
    push: (path: string) => void
    goBack: () => void
  }
  location: {
    pathname: string
  }
  loadVolume: () => Promise<void>
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

// Helper function to format metadata keys (snake_case to Title Case)
const formatMetadataKey = (key: string): string => {
  const tokens = key.split("_")
  if (tokens[0]) {
    tokens[0] = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1)
  }
  return tokens.join(" ")
}

// Main Component
const ShowModal: React.FC<ShowModalProps> = ({ id, volume, history, location, loadVolume }) => {
  const [show, setShow] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Handle modal visibility based on id prop
  useEffect(() => {
    setShow(id != null)

    // Clear error if volume is provided
    if (volume != null) {
      setLoadError(null)
    }
  }, [id, volume])

  // Load volume on mount if not provided
  useEffect(() => {
    if (id != null && !volume) {
      loadVolume().catch((error) => {
        if (!volume) {
          setLoadError(error)
        }
      })
    }
  }, [id, volume, loadVolume])

  const restoreUrl = () => {
    if (!show) {
      history.replace(location.pathname.replace(/(.+)\/.+\/show/, "$1"))
    }
  }

  const hide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  // Render Overview Tab Content
  const renderOverview = (volume: Volume | null) => {
    if (loadError) {
      return (
        <>
          <div className="text-danger">
            <h4>Could not load volume!</h4>
            <p>{loadError}</p>
          </div>
        </>
      )
    }

    if (!volume) {
      return (
        <>
          <span className="spinner"></span> Loading...
        </>
      )
    }

    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={volume.name} />
          <Row label="ID" value={volume.id} />
          <Row label="Description" value={volume.description} />
          <Row label="Size (GB)" value={volume.size} />
          <Row label="Type" value={volume.volume_type} />
          <Row label="Availability Zone" value={volume.availability_zone} />
          <Row label="Status" value={volume.status} />
          <Row label="Replication Status" value={volume.replication_status} />

          <Row label="Metadata">
            {volume.metadata &&
              Object.keys(volume.metadata).map((key, index) => (
                <div key={index}>
                  {key}: {volume.metadata![key]}
                </div>
              ))}
          </Row>

          <Row label="User">
            {volume.user_name ? (
              <>
                {volume.user_name}
                <br />
                <span className="info-text">{volume.user_id}</span>
              </>
            ) : (
              volume.user_id
            )}
          </Row>
          <Row label="Bootable" value={volume.bootable} />
          <Row label="Encrypted" value={volume.encrypted} />
          <Row label="Multiattach" value={volume.multiattach} />
          <Row label="Snapshot ID" value={volume.snapshot_id} />
          <Row label="Source Volume ID" value={volume.source_volid} />
          <Row label="Consistency Group ID" value={volume.consistencygroup_id} />

          <Row label="Created At">
            <PrettyDate date={volume.created_at} />
          </Row>
          <Row label="Updated At">
            <PrettyDate date={volume.updated_at} />
          </Row>
        </tbody>
      </table>
    )
  }

  // Render Attachments Tab Content
  const renderAttachments = (volume: Volume | null) => {
    if (!volume) return null

    return (
      <table className="table">
        <thead>
          <tr>
            <th>Attachment ID</th>
            <th>Server</th>
            <th>Device</th>
            <th>Attached At</th>
          </tr>
        </thead>
        <tbody>
          {volume.attachments!.map((attachment, index) => (
            <tr key={index}>
              <td>{attachment.attachment_id}</td>
              <td>
                {attachment.server_name ? (
                  <>
                    {attachment.server_name}
                    <br />
                    <span className="info-text">{attachment.server_id}</span>
                  </>
                ) : (
                  attachment.server_id
                )}
              </td>
              <td>{attachment.device}</td>
              <td>
                <PrettyDate date={attachment.attached_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // Render About Bootable Tab Content
  const renderAboutBootable = (volume: Volume | null) => {
    if (!volume || !volume.volume_image_metadata) return null

    const values = Object.keys(volume.volume_image_metadata).map((key) => ({
      name: formatMetadataKey(key),
      value: volume.volume_image_metadata![key],
    }))

    return (
      <table className="table no-borders">
        <tbody>
          {values.map((data, index) => (
            <Row label={data.name} key={index} value={data.value} />
          ))}
        </tbody>
      </table>
    )
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
          Volume {volume ? volume.name : <span className="info-text">{id}</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveKey={"overview"} id={"overview"}>
          <Tab eventKey="overview" title="Overview">
            {renderOverview(volume)}
          </Tab>
          {volume && volume.volume_image_metadata && (
            <Tab eventKey="volume_image_metadata" title="About Bootable">
              {renderAboutBootable(volume)}
            </Tab>
          )}
          {volume && volume.attachments && volume.attachments.length > 0 && (
            <Tab eventKey="attachments" title="Attachments">
              {renderAttachments(volume)}
            </Tab>
          )}
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={hide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowModal
export type { ShowModalProps, Volume, VolumeAttachment }
