import React, { useState, useEffect, useCallback } from "react"
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { JsonViewer } from "@cloudoperators/juno-ui-components"
import { policy } from "lib/policy"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareNetwork {
  id: string
  name?: string
  description?: string
  cidr?: string
  ip_version?: number
  network_type?: string
  neutron_net_id?: string
  neutron_subnet_id?: string
  project_id?: string
}

interface NetworkItem {
  id: string
  name?: string
  description?: string
  shared?: boolean
  status?: string
}

interface SubnetItem {
  id: string
  name?: string
  description?: string
  cidr?: string
  gateway_ip?: string
  ip_version?: number
  network_id?: string
}

interface History {
  replace: (path: string) => void
}

interface ShowShareNetworkProps {
  shareNetwork: ShareNetwork | null
  network?: NetworkItem | null
  subnet?: SubnetItem | null
  shareServerItems?: unknown[]
  isFetchingShareServers?: boolean
  isFetchingNetwork?: boolean
  isFetchingSubnet?: boolean
  history: History
  loadShareServersOnce: () => void
}

// ─── Row helper ───────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({
  label,
  value,
  children,
}) => (
  <tr>
    <th style={{ width: "30%" }}>{label}</th>
    <td>{value || children}</td>
  </tr>
)

// ─── Component ────────────────────────────────────────────────────────────────

const ShowShareNetwork: React.FC<ShowShareNetworkProps> = ({
  shareNetwork,
  network,
  subnet,
  shareServerItems,
  isFetchingShareServers,
  isFetchingNetwork,
  isFetchingSubnet,
  history,
  loadShareServersOnce,
}) => {
  const [show, setShow] = useState(shareNetwork != null)

  useEffect(() => {
    setShow(shareNetwork != null)
  }, [shareNetwork])

  useEffect(() => {
    loadShareServersOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) e.stopPropagation()
      setShow(false)
      setTimeout(() => history.replace("/share-networks"), 300)
    },
    [history]
  )

  const renderOverview = (sn: ShareNetwork) => (
    <table className="table no-borders">
      <tbody>
        <Row label="Name" value={sn.name} />
        <Row label="ID" value={sn.id} />
        <Row label="Description" value={sn.description} />
        <Row label="Cidr" value={sn.cidr} />
        <Row label="IP Version" value={sn.ip_version} />
        <Row label="Network Type" value={sn.network_type} />
        <Row label="Neutron Network ID" value={sn.neutron_net_id} />
        <Row label="Neutron Subnet ID" value={sn.neutron_subnet_id} />
        <Row label="Project ID" value={sn.project_id} />
      </tbody>
    </table>
  )

  const renderNetwork = (net?: NetworkItem | null) => {
    if (!net) return null
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={net.name} />
          <Row label="ID" value={net.id} />
          <Row label="Description" value={net.description} />
          <Row label="Shared" value={net.shared ? "Yes" : "No"} />
          <Row label="Status" value={net.status} />
        </tbody>
      </table>
    )
  }

  const renderSubnet = (sub?: SubnetItem | null) => {
    if (!sub) return null
    return (
      <table className="table no-borders">
        <tbody>
          <Row label="Name" value={sub.name} />
          <Row label="ID" value={sub.id} />
          <Row label="Description" value={sub.description} />
          <Row label="Cidr" value={sub.cidr} />
          <Row label="Gateway IP" value={sub.gateway_ip} />
          <Row label="IP Version" value={sub.ip_version} />
          <Row label="Network ID" value={sub.network_id} />
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

  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Share Network {shareNetwork ? shareNetwork.name : ""}
        </Modal.Title>
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
            {policy.isAllowed("context_is_sharedfilesystem_admin") && (
              <Tab eventKey={2} title="Share Servers">
                {renderShareServers()}
              </Tab>
            )}
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
