import { Modal, Button, Tabs, Tab } from "react-bootstrap"
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

export default class ShowPortModal extends React.Component {
  state = {
    show: true,
  }

  close = (e) => {
    if (e) e.stopPropagation()
    //this.props.history.goBack()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/ports"), 300)
  }

  componentDidMount() {
    this.loadDependencies(this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.loadDependencies(nextProps)
  }

  loadDependencies(props) {
    props.loadPort()
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }

  renderNetwork = (port) => {
    let network = this.props.networks.items.find((n) => n.id == port.network_id)

    return (
      <div>
        {this.props.networks.isFetching && <span className="spinner"></span>}
        {network && (
          <span>
            {network.name}
            <br />
          </span>
        )}
        <span className={network && "info-text"}>{port.network_id}</span>
      </div>
    )
  }

  renderSubnets = (port) =>
    (port.fixed_ips || []).map((ip, index) => {
      let subnet = this.props.subnets.items.find((s) => s.id == ip.subnet_id)

      return (
        <div key={index}>
          <b>{ip.ip_address} </b>

          {this.props.subnets.isFetching && <span className="spinner"></span>}
          {subnet && <span>{subnet.name}</span>}
          <br />
          <span className="info-text">subnet id: {ip.subnet_id}</span>
        </div>
      )
    })

  renderSecurityGroups = (port) => {
    const items = port.security_groups.map((groupId) => {
      if (!this.props.securityGroups || !this.props.securityGroups.items) {
        return <div key={groupId}>{groupId}</div>
      }
      const securityGroup = this.props.securityGroups.items.filter((i) => i.id == groupId)[0]

      if (!securityGroup) return <div key={groupId}>{groupId}</div>

      return (
        <li key={groupId}>
          <span>{securityGroup.name}</span>
          <br />
          <span className="info-text">{groupId}</span>
        </li>
      )
    })

    return <ul className="plain-list">{items}</ul>
  }

  renderTable(port) {
    let fixed_ips = port.fixed_ips || []

    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Port ID" value={port.id} />
          <Row label="MAC" value={port.mac_address} />
          <Row label="Network">{this.renderNetwork(port)}</Row>
          <Row label="IPs">{this.renderSubnets(port)}</Row>
          <Row label="Description" value={port.description} />
          <Row label="Name" value={port.name} />
          <Row label="Device Owner" value={port.device_owner} />
          <Row label="Device ID" value={port.device_id} />
          <Row label="Created at" value={port.created_at} />
          <Row label="Updated at" value={port.created_at} />
          <Row label="Project ID" value={port.tenant_id || port.project_id} />
          <Row label="Status" value={port.status} />
          <Row label="Security Groups">{this.renderSecurityGroups(port)}</Row>
        </tbody>
      </table>
    )
  }

  render() {
    return (
      <Modal show={this.state.show} onHide={this.close} bsSize="large" aria-labelledby="contained-modal-title-lg">
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Port {this.port && (this.port.description || this.port.id)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.port ? this.renderTable(this.props.port) : <span className="spinner"></span>}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
