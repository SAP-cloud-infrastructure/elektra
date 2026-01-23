import React, { useEffect, useRef } from "react"
// @ts-expect-error - react-redux types not available
import { connect } from "react-redux"

import {
  openEditClusterDialog,
  requestDeleteCluster,
  loadCluster,
  getCredentials,
  getSetupInfo,
  startPollingCluster,
  stopPollingCluster,
} from "../../actions"

import ClusterEvents from "./events"

// Type definitions
interface NodePoolStatus {
  name: string
  size: number
  healthy?: number
  running?: number
  schedulable?: number
}

interface NodePoolSpec {
  name: string
  size: number
  flavor: string
  availabilityZone: string
}

interface ClusterStatus {
  phase: string
  apiserverVersion?: string
  message: string
  nodePools: NodePoolStatus[]
  dashboard?: string
}

interface ClusterSpec {
  version: string
  nodePools: NodePoolSpec[]
  dashboard?: boolean
}

interface ClusterData {
  name: string
  isTerminating?: boolean
  isPolling?: boolean
  status: ClusterStatus
  spec: ClusterSpec
}

interface ClusterProps {
  cluster: ClusterData
  kubernikusBaseUrl?: string
  handleEditCluster: (cluster: ClusterData) => void
  handleClusterDelete: (clusterName: string) => void
  handleGetCredentials: (clusterName: string) => void
  handleGetSetupInfo: (clusterName: string, kubernikusBaseUrl?: string) => void
  reloadCluster: (clusterName: string) => void
  handlePollingStart: (clusterName: string) => void
  handlePollingStop: (clusterName: string) => void
}

interface RootState {
  clusters: {
    items: ClusterData[]
  }
}

const Cluster: React.FC<ClusterProps> = ({
  cluster,
  kubernikusBaseUrl,
  handleEditCluster,
  handleClusterDelete,
  handleGetCredentials,
  handleGetSetupInfo,
  reloadCluster,
  handlePollingStart,
  handlePollingStop,
}) => {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper functions
  const clusterReady = (clusterData: ClusterData): boolean => {
    return clusterData.status.phase === "Running" && clusterData.spec.version === clusterData.status.apiserverVersion
  }

  const nodePoolStatus = (clusterData: ClusterData, poolName: string): NodePoolStatus | undefined => {
    return clusterData.status.nodePools.find((pool) => pool.name === poolName)
  }

  const nodePoolReady = (nodePool: NodePoolSpec, clusterData: ClusterData): boolean => {
    const status = nodePoolStatus(clusterData, nodePool.name)
    if (!status) return false

    return status.healthy === status.size && status.running === status.size && status.schedulable === status.size
  }

  const nodePoolsReady = (clusterData: ClusterData): boolean => {
    // Not ready if number of nodepools in spec and status don't match
    if (clusterData.status.nodePools.length !== clusterData.spec.nodePools.length) {
      return false
    }

    // Return ready only if all state values of all nodepools match the configured size
    return clusterData.spec.nodePools.every((nodePool) => nodePoolReady(nodePool, clusterData))
  }

  const startPolling = () => {
    handlePollingStart(cluster.name)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    pollingIntervalRef.current = setInterval(() => {
      reloadCluster(cluster.name)
    }, 10000)
  }

  const stopPolling = () => {
    handlePollingStop(cluster.name)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // Handle polling lifecycle - replaces UNSAFE_componentWillReceiveProps
  useEffect(() => {
    // Stop polling if both cluster and nodepool states are "ready"
    if (clusterReady(cluster) && nodePoolsReady(cluster)) {
      stopPolling()
    } else if (!cluster.isPolling) {
      startPolling()
    }
  }, [
    cluster.status.phase,
    cluster.status.apiserverVersion,
    cluster.spec.version,
    cluster.status.nodePools,
    cluster.spec.nodePools,
    cluster.isPolling,
  ])

  // Handle component mount - replaces componentDidMount
  useEffect(() => {
    if (!clusterReady(cluster) || !nodePoolsReady(cluster)) {
      startPolling()
    }

    // Cleanup on unmount - replaces componentWillUnmount
    return () => {
      stopPolling()
    }
  }, [])

  // Event handlers
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    handleEditCluster(cluster)
  }

  const handleCredentials = (e: React.MouseEvent) => {
    e.preventDefault()
    handleGetCredentials(cluster.name)
  }

  const handleSetupInfo = (e: React.MouseEvent) => {
    e.preventDefault()
    handleGetSetupInfo(cluster.name, kubernikusBaseUrl)
  }

  // Calculate disabled state
  const disabled =
    cluster.isTerminating ||
    cluster.status.phase === "Terminating" ||
    cluster.status.phase === "Pending" ||
    cluster.status.phase === "Creating"

  return (
    <tbody className={disabled ? "item-disabled" : undefined}>
      <tr>
        <td>{cluster.name}</td>
        <td>
          <div>
            <strong>{cluster.status.phase}</strong>
            {!clusterReady(cluster) && <span className="spinner" />}
          </div>
          {cluster.status.apiserverVersion && <div>Version: {cluster.status.apiserverVersion}</div>}
          <div className="info-text">{cluster.status.message}</div>
        </td>
        <td className="nodepool-spec">
          {cluster.spec.nodePools.map((nodePool) => {
            const status = nodePoolStatus(cluster, nodePool.name)

            return (
              <div className="nodepool" key={nodePool.name}>
                <div className="nodepool-info">
                  <div>
                    <strong>{nodePool.name}</strong>
                  </div>
                  <div>{nodePool.availabilityZone}</div>
                  <div>
                    <span className="info-text">{nodePool.flavor}</span>
                  </div>
                  <div>size: {nodePool.size}</div>
                </div>
                <div className="nodepool-info">
                  {status ? (
                    <>
                      {Object.entries(status).map(([key, value]) => {
                        if (key === "name" || key === "size") return null

                        return (
                          <div key={`status-${key}`}>
                            <strong>{key}: </strong>
                            {value}/{nodePool.size}
                            {value !== nodePool.size && <span className="spinner" />}
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div>
                      Loading <span className="spinner" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </td>
        <td className="vertical-buttons">
          <button className="btn btn-sm btn-primary btn-icon-text" disabled={disabled} onClick={handleEdit}>
            <i className="fa fa-fw fa-pencil" />
            Edit Cluster
          </button>
          <button className="btn btn-sm btn-default btn-icon-text" disabled={disabled} onClick={handleCredentials}>
            <i className="fa fa-fw fa-download" />
            Download Credentials
          </button>
          <button className="btn btn-sm btn-default btn-icon-text" disabled={disabled} onClick={handleSetupInfo}>
            <i className="fa fa-fw fa-wrench" />
            Setup
          </button>
          {cluster.spec.dashboard && cluster.status.dashboard && (
            <a
              className="btn btn-sm btn-default btn-icon-text"
              href={cluster.status.dashboard}
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa fa-fw fa-dashboard" />
              Kubernetes Dashboard
            </a>
          )}
        </td>
      </tr>
      <ClusterEvents cluster={cluster} />
    </tbody>
  )
}

export default connect(
  (state: RootState, ownProps: { cluster: ClusterData }) => {
    const cluster = state.clusters.items.find((item) => item.name === ownProps.cluster.name)
    return { cluster: cluster || ownProps.cluster }
  },
  (dispatch) => ({
    handleEditCluster(cluster: ClusterData) {
      return dispatch(openEditClusterDialog(cluster) as any)
    },
    handleClusterDelete(clusterName: string) {
      return dispatch(requestDeleteCluster(clusterName) as any)
    },
    handleGetCredentials(clusterName: string) {
      return dispatch(getCredentials(clusterName) as any)
    },
    handleGetSetupInfo(clusterName: string, kubernikusBaseUrl?: string) {
      return dispatch(getSetupInfo(clusterName, kubernikusBaseUrl) as any)
    },
    reloadCluster(clusterName: string) {
      return dispatch(loadCluster(clusterName) as any)
    },
    handlePollingStart(clusterName: string) {
      return dispatch(startPollingCluster(clusterName) as any)
    },
    handlePollingStop(clusterName: string) {
      return dispatch(stopPollingCluster(clusterName) as any)
    },
  })
)(Cluster)
