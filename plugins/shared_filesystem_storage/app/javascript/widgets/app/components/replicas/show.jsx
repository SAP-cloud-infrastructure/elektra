import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Link } from "react-router-dom"
import { titleCase } from "lib/tools/utils"
import React from "react"

const ShowReplica = ({ history, replica }) => {
  const [isOpen, setIsOpen] = React.useState(true)

  const close = React.useCallback(
    (e) => {
      if (e) e.stopPropagation()
      setIsOpen(false)
      setTimeout(() => history.replace("/replicas"), 300)
    },
    [history]
  )

  const replicaProperties = React.useMemo(
    () =>
      replica
        ? Object.keys(replica)
            .filter(
              (key) => ["search_label", "cached_object_type"].indexOf(key) < 0
            )
            .sort()
        : [],
    [replica]
  )

  return (
    <Modal
      show={isOpen}
      onHide={close}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Show Replica {replica && replica.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!replica ? (
          <div>
            <span className="spinner" />
            Loading...
          </div>
        ) : (
          <table className="table no-borders">
            <tbody>
              {replicaProperties.map((key, index) => (
                <tr key={index}>
                  <th style={{ width: "30%" }}>
                    {titleCase(key.replace(/_/g, " "))}
                  </th>
                  <td>
                    {key === "share_id" ? (
                      <Link to={`/shares/${replica.share_id}/show`}>
                        {replica.share_id}
                      </Link>
                    ) : (
                      replica[key]
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowReplica
