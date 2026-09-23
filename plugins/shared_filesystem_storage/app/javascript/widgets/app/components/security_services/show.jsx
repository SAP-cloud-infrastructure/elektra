import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { policy } from "lib/policy"
import React from "react"

const Row = ({ label, value, children }) => (
  <tr>
    <th>{label}</th>
    <td>{children || value}</td>
  </tr>
)

export default class ShowSecurityService extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true, showPassword: false }
    this.close = this.close.bind(this)
    this.togglePasswordDisplay = this.togglePasswordDisplay.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    //this.props.history.goBack()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/security-services"), 300)
  }

  togglePasswordDisplay() {
    this.setState({ showPassword: !this.state.showPassword })
  }

  renderBody(securityService) {
    return (
      <table className="table no-borders">
        {policy.isAllowed("shared_filesystem_storage:security_service_get") ? (
          <tbody>
            <Row label="Type" value={securityService.type} />
            <Row label="OU (Organizational Unit)" value={securityService.ou} />
            <Row label="Name" value={securityService.name} />
            <Row label="ID" value={securityService.id} />
            <Row label="Status" value={securityService.status} />
            <Row label="Description" value={securityService.description} />
            <Row label="DNS IP" value={securityService.dns_ip} />
            <Row label="User" value={securityService.user} />
            <Row label="Password">
              {this.state.showPassword ? securityService.password : "******"}
              &nbsp;
              <button
                className={`btn btn-${
                  this.state.showPassword ? "success" : "danger"
                } btn-sm pull-right`}
                onClick={this.togglePasswordDisplay}
              >
                {this.state.showPassword ? "Hide" : "Show"}
              </button>
            </Row>
            <Row label="Domain" value={securityService.domain} />
            <Row label="Server" value={securityService.server} />
            <Row label="Created At" value={securityService.created_at} />
            <Row label="Updated At" value={securityService.updated_at} />
          </tbody>
        ) : (
          <tbody>
            <Row label="Type" value={securityService.type} />
            <Row label="Name" value={securityService.name} />
            <Row label="ID" value={securityService.id} />
            <Row label="Status" value={securityService.status} />
          </tbody>
        )}
      </table>
    )
  }

  render() {
    let securityService = this.props.securityService

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Security Service {securityService ? securityService.name : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.isFetching ? (
            <span className="spinner" />
          ) : !this.props.securityService ? (
            <span>Could not load security service</span>
          ) : (
            this.renderBody(securityService)
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
