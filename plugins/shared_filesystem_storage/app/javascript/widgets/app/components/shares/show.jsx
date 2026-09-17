import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Tabs, Tab } from "lib/components/Tabs"
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

export default class ShowShareModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: props.share != null }
    this.close = this.close.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    //this.props.history.goBack()
    this.setState({ show: false })
    setTimeout(
      () => this.props.history.replace(`/${this.props.match.params.parent}`),
      300
    )
  }

  overview(share) {
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={share.name} />
          <Row label="Description" value={share.description} />
          <Row label="ID" value={share.id} />
          <Row label="Status" value={share.status} />
          <Row label="Export Locations">
            {share?.export_locations &&
              share.export_locations.map((location, index) => (
                <div key={index}>{location}</div>
              ))}
          </Row>
          <Row label="Availability zone" value={share.availability_zone} />
          <Row label="Size" value={share.size + " GiB"} />
          <Row label="Snapshot ID" value={share.snapshot_id} />
          <Row label="Protocol" value={share.share_proto} />
          <Row
            label="Share Type"
            value={share.share_type_name + " (" + share.share_type + ")"}
          />
          <Row label="Share network">
            <Link to={`/share-networks/${share.share_network_id}/show`}>
              {share.share_network_id}
            </Link>
          </Row>
          <Row label="Created At" value={share.created_at} />
          <Row label="Host" value={share.host} />
        </tbody>
      </table>
    )
  }

  metadata(share) {
    if (share.metadata && Object.keys(share.metadata).length > 0) {
      return (
        <table className="table no-borders">
          <tbody>
            {Object.keys(share.metadata).map((key, index) => (
              <Row label={key} key={index} value={share.metadata[key]} />
            ))}
          </tbody>
        </table>
      )
    } else return null
  }

  render() {
    let { share, onHide } = this.props

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Share {share ? share.name : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {share &&
            (share.metadata && Object.keys(share.metadata).length > 0 ? (
              <Tabs defaultActiveKey={1} id="share">
                <Tab eventKey={1} title="Overview">
                  {this.overview(share)}
                </Tab>
                <Tab eventKey={2} title="Metadata">
                  {this.metadata(share)}
                </Tab>
              </Tabs>
            ) : (
              this.overview(share)
            ))}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
