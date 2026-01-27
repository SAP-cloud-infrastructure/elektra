import { Modal, Button } from "react-bootstrap"
import React, { useState, useEffect, useMemo } from "react"

// Types
interface FixedIP {
  subnet_id: string
  ip_address: string
}

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  status: string
  mac_address: string
  fixed_ips?: FixedIP[]
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
  cidr?: string
}

interface SecurityGroup {
  id: string
  name: string
}

interface NetworksState {
  items: Network[]
  isFetching: boolean
}

interface SubnetsState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroupsState {
  items: SecurityGroup[]
}

interface ShowPortModalProps {
  port: Port | null
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
  history: {
    replace: (path: string) => void
    goBack: () => void
  }
  loadPort: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
}

interface RowProps {
  label: string
  value?: string | number | null
  children?: React.ReactNode
}

const Row: React.FC<RowProps> = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

const ShowPortModal: React.FC<ShowPortModalProps> = (props) => {
  const [show, setShow] = useState(true)

  // Load dependencies on mount and when props change
  useEffect(() => {
    props.loadPort()
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }, [props.loadPort, props.loadNetworksOnce, props.loadSubnetsOnce, props.loadSecurityGroupsOnce])

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => props.history.replace("/ports"), 300)
  }

  const renderNetwork = (port: Port) => {
    const network = props.networks.items.find((n) => n.id === port.network_id)

    return (
      <div>
        {props.networks.isFetching && <span className="spinner"></span>}
        {network && (
          <span>
            {network.name}
            <br />
          </span>
        )}
        <span className={network ? "info-text" : ""}>{port.network_id}</span>
      </div>
    )
  }

  const renderSubnets = (port: Port) =>
    (port.fixed_ips || []).map((ip, index) => {
      const subnet = props.subnets.items.find((s) => s.id === ip.subnet_id)

      return (
        <div key={index}>
          <b>{ip.ip_address} </b>

          {props.subnets.isFetching && <span className="spinner"></span>}
          {subnet && <span>{subnet.name}</span>}
          <br />
          <span className="info-text">subnet id: {ip.subnet_id}</span>
        </div>
      )
    })

  const renderSecurityGroups = (port: Port) => {
    const items = port.security_groups.map((groupId) => {
      if (!props.securityGroups || !props.securityGroups.items) {
        return <div key={groupId}>{groupId}</div>
      }
      const securityGroup = props.securityGroups.items.find((i) => i.id === groupId)

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

  const renderTable = (port: Port) => {
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Port ID" value={port.id} />
          <Row label="MAC" value={port.mac_address} />
          <Row label="Network">{renderNetwork(port)}</Row>
          <Row label="IPs">{renderSubnets(port)}</Row>
          <Row label="Description" value={port.description} />
          <Row label="Name" value={port.name} />
          <Row label="Device Owner" value={port.device_owner} />
          <Row label="Device ID" value={port.device_id} />
          <Row label="Created at" value={port.created_at} />
          <Row label="Updated at" value={port.created_at} />
          <Row label="Project ID" value={port.tenant_id || port.project_id} />
          <Row label="Status" value={port.status} />
          <Row label="Security Groups">{renderSecurityGroups(port)}</Row>
        </tbody>
      </table>
    )
  }

  const modalTitle = useMemo(() => {
    if (!props.port) return "Port"
    return `Port ${props.port.description || props.port.id}`
  }, [props.port])

  return (
    <Modal show={show} onHide={close} bsSize="large" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.port ? renderTable(props.port) : <span className="spinner"></span>}</Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowPortModal
