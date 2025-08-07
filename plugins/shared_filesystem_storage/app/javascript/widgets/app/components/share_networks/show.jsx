/* eslint-disable no-undef */
import { Link } from "react-router-dom"
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { JsonViewer } from "@cloudoperators/juno-ui-components"
import React from "react"

const Row = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

export default class ShowShareNetwork extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: props.shareNetwork != null }
    this.close = this.close.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    //this.props.history.goBack()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/share-networks"), 300)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ show: nextProps.shareNetwork != null })
  }

  componentDidMount() {
    this.props.loadShareServersOnce()
  }

  renderOverview(shareNetwork) {
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={shareNetwork.name} />
          <Row label="ID" value={shareNetwork.id} />
          <Row label="Description" value={shareNetwork.description} />
          <Row label="Cidr" value={shareNetwork.cidr} />
          <Row label="IP Version" value={shareNetwork.ip_version} />
          <Row label="Network Type" value={shareNetwork.network_type} />
          <Row label="Neutron Network ID" value={shareNetwork.neutron_net_id} />
          <Row label="Neutron Subnet ID" value={shareNetwork.neutron_subnet_id} />
          <Row label="Project ID" value={shareNetwork.project_id} />
        </tbody>
      </table>
    )
  }

  renderNetwork(network) {
    if (!network) return null
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={network.name} />
          <Row label="ID" value={network.id} />
          <Row label="Description" value={network.description} />
          <Row label="Shared" value={network.shared ? "Yes" : "No"} />
          <Row label="Status" value={network.status} />
        </tbody>
      </table>
    )
  }

  renderShareServers = () => {
    const { shareServerItems, isFetchingShareServers } = this.props

    if (isFetchingShareServers) return <span className="spinner" />

    if (!shareServerItems || shareServerItems.length == 0) {
      return <p className="alert">No share servers found!</p>
    }

    return <JsonViewer data={shareServerItems} expanded={3} />
  }

  renderSubnet(subnet) {
    if (!subnet) return null
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={subnet.name} />
          <Row label="ID" value={subnet.id} />
          <Row label="Description" value={subnet.description} />
          <Row label="Cidr" value={subnet.cidr} />
          <Row label="Gateway IP" value={subnet.gateway_ip} />
          <Row label="IP Version" value={subnet.ip_version} />
          <Row label="Network ID" value={subnet.network_id} />
        </tbody>
      </table>
    )
  }

  render() {
    let { isFetchingShareNetwork, isFetchingSubnet, isFetchingNetwork, shareNetwork, subnet, network } = this.props
    return (
      <Modal show={this.state.show} onHide={this.close} bsSize="large" aria-labelledby="contained-modal-title-lg">
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">Share Network {shareNetwork ? shareNetwork.name : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isFetchingNetwork ? (
            <span className="spinner" />
          ) : !shareNetwork ? (
            <span>Could not load share network</span>
          ) : (
            <Tabs defaultActiveKey={1} id="shareNetwork">
              <Tab eventKey={1} title="Overview">
                {this.renderOverview(shareNetwork)}
              </Tab>
              {policy.isAllowed("context_is_sharedfilesystem_admin") && (
                <Tab eventKey={2} title="Share Servers">
                  {this.renderShareServers()}
                </Tab>
              )}
              <Tab eventKey={3} title="Network">
                {isFetchingNetwork ? <span className="spinner" /> : this.renderNetwork(network)}
              </Tab>
              <Tab eventKey={4} title="Subnet">
                {isFetchingSubnet ? <span className="spinner" /> : this.renderSubnet(subnet)}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
