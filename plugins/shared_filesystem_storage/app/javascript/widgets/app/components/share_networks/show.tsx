import React, { useState, useEffect } from "react"
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { JsonViewer } from "@cloudoperators/juno-ui-components"

interface ShareNetwork {
  id: string
  name?: string
  description?: string
  cidr?: string
  ip_version?: number
  network_type?: string
  neutron_net_id: string
  neutron_subnet_id: string
  project_id?: string
}

interface Network {
  id: string
  name?: string
  description?: string
  shared?: boolean
  status?: string
}

interface Subnet {
  id: string
  name?: string
  description?: string
  cidr?: string
  gateway_ip?: string
  ip_version?: number
  network_id?: string
}

interface ShowShareNetworkProps {
  shareNetwork: ShareNetwork | null
  network: Network | null
  subnet: Subnet | null
  shareServerItems?: unknown[]
  isFetchingShareNetwork: boolean
  isFetchingNetwork: boolean
  isFetchingSubnet: boolean
  isFetchingShareServers: boolean
  history: {
    replace: (path: string) => void
  }
  loadShareServersOnce: () => void
}

interface RowProps {
  label: string
  value?: string | number
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

const ShowShareNetwork: React.FC<ShowShareNetworkProps> = ({
  shareNetwork,
  network,
  subnet,
  shareServerItems,
  isFetchingShareNetwork,
  isFetchingNetwork,
  isFetchingSubnet,
  isFetchingShareServers,
  history,
  loadShareServersOnce,
}) => {
  const [show, setShow] = useState(shareNetwork !== null)

  useEffect(() => {
    setShow(shareNetwork !== null)
  }, [shareNetwork])

  useEffect(() => {
    loadShareServersOnce()
  }, [loadShareServersOnce])

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/share-networks"), 300)
  }

  const renderOverview = (shareNetwork: ShareNetwork) => {
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

  const renderNetwork = (network: Network | null) => {
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

  const renderShareServers = () => {
    if (isFetchingShareServers) return <span className="spinner" />

    if (!shareServerItems || shareServerItems.length === 0) {
      return <p className="alert">No share servers found!</p>
    }

    return <JsonViewer data={shareServerItems} expanded={3} />
  }

  const renderSubnet = (subnet: Subnet | null) => {
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

  return (
    <Modal show={show} onHide={close} size="lg" aria-labelledby="contained-modal-title-lg">
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
              {renderOverview(shareNetwork)}
            </Tab>
            <Tab eventKey={2} title="Share Servers">
              {renderShareServers()}
            </Tab>
            <Tab eventKey={3} title="Network">
              {isFetchingNetwork ? <span className="spinner" /> : renderNetwork(network)}
            </Tab>
            <Tab eventKey={4} title="Subnet">
              {isFetchingSubnet ? <span className="spinner" /> : renderSubnet(subnet)}
            </Tab>
          </Tabs>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowShareNetwork
