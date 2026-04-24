import { Modal, Button } from "react-bootstrap"
import { Link } from "react-router-dom"
import React from "react"

const Row = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

export default class ShowSnapshot extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true }
    this.close = this.close.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/snapshots"), 300)
  }

  render() {
    let { snapshot } = this.props

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Show Snapshot {snapshot && snapshot.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {!snapshot ? (
            <div>
              <span className="spinner" />
              Loading...
            </div>
          ) : (
            <table className="table no-borders">
              <tbody>
                <Row label="Name" value={snapshot.name} />
                <Row label="ID" value={snapshot.id} />
                <Row label="Status" value={snapshot.status} />
                <Row label="Description" value={snapshot.description} />
                <Row label="Provider Location" value={snapshot.provider_location} />
                <Row label="Share ID">
                  <Link to={`/shares/${snapshot.share_id}/show`}>
                    {snapshot.share_id}
                  </Link>
                </Row>
                <Row label="Share Size" value={snapshot.share_size + " GiB"} />
                <Row label="Protocol" value={snapshot.share_proto} />
                <Row label="Created At" value={snapshot.created_at} />
              </tbody>
            </table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
