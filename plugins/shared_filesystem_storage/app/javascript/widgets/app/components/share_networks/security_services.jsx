import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import ShareNetworkSecurityServiceItem from "./security_service_item"
import ShareNetworkSecurityServiceForm from "./security_service_form"
import { TransitionGroup } from "react-transition-group"
import { FadeTransition } from "lib/components/transitions"
import React from "react"
export default class ShareNetworkSecurityServicesModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true, showForm: false }
    this.close = this.close.bind(this)
    this.toggleForm = this.toggleForm.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.availableSecurityServices = this.availableSecurityServices.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    //this.props.history.goBack()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/share-networks"), 300)
  }

  toggleForm() {
    this.setState({ showForm: !this.state.showForm })
  }

  componentDidMount() {
    return this.props.loadShareNetworkSecurityServicesOnce(
      this.props.match.params.id
    )
  }

  availableSecurityServices() {
    let securityServices
    let assignedSecurityServices = []
    if (!this.props.securityServices) {
      securityServices = []
    }
    if (this.props.shareNetworkSecurityServices) {
      assignedSecurityServices = this.props.shareNetworkSecurityServices.items
    }
    const assignedSecurityServicesIds = []
    const assignedSecurityServicesTypes = []
    for (let securityService of assignedSecurityServices) {
      assignedSecurityServicesIds.push(securityService.id)
      assignedSecurityServicesTypes.push(securityService.type)
    }
    const available = []
    for (let securityService of this.props.securityServices) {
      if (
        assignedSecurityServicesIds.indexOf(securityService.id) < 0 &&
        assignedSecurityServicesTypes.indexOf(securityService.type) < 0
      ) {
        available.push(securityService)
      }
    }
    return available
  }

  handleSubmit(values) {
    return this.props
      .handleSubmit(values)
      .then(() => this.setState({ showForm: false }))
  }

  render() {
    const availableSecurityServices = this.availableSecurityServices()
    const { shareNetworkSecurityServices } = this.props

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Security Services for Share Network{" "}
            {this.props.shareNetwork && this.props.shareNetwork.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {!shareNetworkSecurityServices ||
          shareNetworkSecurityServices.isFetching ? (
            <div>
              <span className="spinner" />
              {"Loading..."}
            </div>
          ) : (
            <table className="table share-network-security-services">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="snug"></th>
                </tr>
              </thead>
              <tbody>
                {shareNetworkSecurityServices.items.length === 0 ? (
                  <tr>
                    <td colSpan="5">No Security Service found.</td>
                  </tr>
                ) : (
                  shareNetworkSecurityServices.items.map((securityService) => (
                    <ShareNetworkSecurityServiceItem
                      key={securityService.id}
                      securityService={securityService}
                      handleDelete={this.props.handleDelete}
                    />
                  ))
                )}

                {availableSecurityServices.length > 0 && (
                  <tr>
                    <td colSpan="4">
                      <TransitionGroup>
                        {this.state.showForm && (
                          <FadeTransition>
                            <ShareNetworkSecurityServiceForm
                              securityServices={this.props.securityServices}
                              shareNetworkSecurityServices={
                                this.props.shareNetworkSecurityServices
                              }
                              handleSubmit={this.handleSubmit}
                              availableSecurityServices={
                                availableSecurityServices
                              }
                            />
                          </FadeTransition>
                        )}
                      </TransitionGroup>
                    </td>
                    <td>
                      <a
                        className={`btn btn-${
                          this.state.showForm ? "default" : "primary"
                        } btn-sm`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          this.toggleForm()
                        }}
                      >
                        <i
                          className={`fa ${
                            this.state.showForm ? "fa-close" : "fa-plus"
                          }`}
                        />
                      </a>
                    </td>
                  </tr>
                )}
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
