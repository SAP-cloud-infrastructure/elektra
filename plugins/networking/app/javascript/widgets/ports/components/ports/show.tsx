import React, { useState, useEffect } from "react"
// @ts-expect-error – missing types for react-bootstrap
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { Link } from "react-router-dom"

interface RowProps {
  label: string
  value?: string
  children?: React.ReactNode
}

interface FixedIP {
  subnet_id: string
  ip_address: string
}

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  fixed_ips?: FixedIP[]
  status: string
  mac_address?: string
  device_owner?: string
  device_id?: string
  created_at?: string
  updated_at?: string
  tenant_id?: string
  project_id?: string
  security_groups: string[]
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
}

interface SecurityGroup {
  id: string
  name: string
}

interface NetworkState {
  items: Network[]
  isFetching: boolean
}

interface SubnetState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroupState {
  items: SecurityGroup[]
  isFetching: boolean
}

interface ShowPortModalProps {
  port?: Port
  networks: NetworkState
  subnets: SubnetState
  securityGroups: SecurityGroupState
  loadPort: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  history: {
    replace: (path: string) => void
  }
}

const Row: React.FC<RowProps> = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

const ShowPortModal: React.FC<ShowPortModalProps> = ({
  port,
  networks,
  subnets,
  securityGroups,
  loadPort,
  loadNetworksOnce,
  loadSubnetsOnce,
  loadSecurityGroupsOnce,
  history,
}) => {
  const [show, setShow] = useState(true)

  // Load dependencies on mount and when they change
  useEffect(() => {
    loadPort()
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
  }, [loadPort, loadNetworksOnce, loadSubnetsOnce, loadSecurityGroupsOnce])

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/ports"), 300)
  }

  const renderNetwork = (portData: Port) => {
    const network = networks.items.find((n) => n.id === portData.network_id)

    return (
      <div>
        {networks.isFetching && <span className="spinner"></span>}
        {network && (
          <span>
            {network.name}
            <br />
          </span>
        )}
        <span className={network ? "info-text" : ""}>{portData.network_id}</span>
      </div>
    )
  }

  const renderSubnets = (portData: Port) =>
    (portData.fixed_ips || []).map((ip, index) => {
      const subnet = subnets.items.find((s) => s.id === ip.subnet_id)

      return (
        <div key={index}>
          <b>{ip.ip_address} </b>

          {subnets.isFetching && <span className="spinner"></span>}
          {subnet && <span>{subnet.name}</span>}
          <br />
          <span className="info-text">subnet id: {ip.subnet_id}</span>
        </div>
      )
    })

  const renderSecurityGroups = (portData: Port) => {
    const items = portData.security_groups.map((groupId) => {
      if (!securityGroups || !securityGroups.items) {
        return <div key={groupId}>{groupId}</div>
      }
      const securityGroup = securityGroups.items.filter((i) => i.id === groupId)[0]

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

  const renderTable = (portData: Port) => {
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Port ID" value={portData.id} />
          <Row label="MAC" value={portData.mac_address} />
          <Row label="Network">{renderNetwork(portData)}</Row>
          <Row label="IPs">{renderSubnets(portData)}</Row>
          <Row label="Description" value={portData.description} />
          <Row label="Name" value={portData.name} />
          <Row label="Device Owner" value={portData.device_owner} />
          <Row label="Device ID" value={portData.device_id} />
          <Row label="Created at" value={portData.created_at} />
          <Row label="Updated at" value={portData.created_at} />
          <Row label="Project ID" value={portData.tenant_id || portData.project_id} />
          <Row label="Status" value={portData.status} />
          <Row label="Security Groups">{renderSecurityGroups(portData)}</Row>
        </tbody>
      </table>
    )
  }

  return (
    <Modal show={show} onHide={close} size="lg" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Port {port && (port.description || port.id)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{port ? renderTable(port) : <span className="spinner"></span>}</Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowPortModal
