import React from "react"
import { Modal, Button } from "react-bootstrap"
import { PrettyDate } from "lib/components/pretty_date"

const Row = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

export default class ShowModal extends React.Component {
  state = { show: false, loadError: null }

  restoreUrl = (e) => {
    if (!this.state.show) this.props.history.replace(`/snapshots`)
  }

  hide = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  componentDidMount() {
    this.setState({
      show: this.props.id != null,
    })
    if (!this.props.snapshot) {
      this.props.loadSnapshot().catch((loadError) => {
        if (!this.props.snapshot) this.setState({ loadError })
      })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      show: nextProps.id != null,
      loadError: nextProps.snapshot != null ? null : this.state.loadError,
    })
  }

  render() {
    let { snapshot } = this.props

    return (
      <Modal
        show={this.state.show}
        onExited={this.restoreUrl}
        onHide={this.hide}
        dialogClassName="modal-xl"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton={true}>
          <Modal.Title id="contained-modal-title-lg">
            Snapshot {snapshot ? snapshot.name : <span className="info-text">{this.props.id}</span>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.state.loadError && (
            <>
              <div className="text-danger">
                <h4>Could not load snapshot!</h4>
                <p>{this.state.loadError}</p>
              </div>
            </>
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
                        {key}: {snapshot.metadata[key]}
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
          <Button onClick={this.hide} name="close">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
