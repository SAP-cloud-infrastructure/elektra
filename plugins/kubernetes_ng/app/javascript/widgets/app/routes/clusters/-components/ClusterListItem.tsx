import React from "react"
import { Cluster } from "../../../types/cluster"
import { DataGridRow, DataGridCell, Icon, Stack, Button } from "@cloudoperators/juno-ui-components"
import ReadinessConditions from "../../../components/ReadinessConditions"
import { Link, useNavigate } from "@tanstack/react-router"

// Determine status icon and color based on cluster status
// Possible statuses:'healthy', 'progressing', 'unhealthy', 'unknown'
const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "healthy":
      return {
        color: "tw-text-theme-success",
        icon: "checkCircle" as const,
      }
    case "progressing":
      return {
        color: "tw-text-theme-warning",
        icon: "warning" as const,
      }
    case "unhealthy":
      return {
        color: "tw-text-theme-error",
        icon: "dangerous" as const,
      }
    case "deleted":
      return {
        color: "tw-text-theme-light",
        icon: "checkCircle" as const,
      }
    default:
      return {
        color: "tw-text-theme-warning",
        icon: "help" as const,
      }
  }
}

interface ClusterListItemProps {
  cluster: Cluster
}

const ClusterListItem: React.FC<ClusterListItemProps> = ({ cluster, ...props }) => {
  const status = cluster.isDeleted ? "deleted" : cluster.status
  const statusStyles = getStatusStyles(status)
  const navigate = useNavigate()

  return (
    <DataGridRow
      {...props}
      tabIndex={0}
      aria-label={`View details for cluster ${cluster.name}`}
      className="tw-cursor-pointer hover:tw-underline"
      onClick={() => {
        navigate({
          to: "/clusters/$clusterName",
          params: { clusterName: cluster.name },
        })
      }}
    >
      <DataGridCell>
        <Icon
          color={statusStyles.color}
          icon={statusStyles.icon}
          data-status-icon="status-icon"
          data-icon={statusStyles.icon}
          data-color={statusStyles.color}
        />
      </DataGridCell>
      <DataGridCell>{cluster.status}</DataGridCell>
      <DataGridCell>
        <p className="tw-font-bold">{cluster.name}</p>
      </DataGridCell>
      <DataGridCell>
        <ReadinessConditions conditions={cluster.readiness.conditions} />
      </DataGridCell>
      <DataGridCell>{cluster.lastOperationSummary}</DataGridCell>
      <DataGridCell>
        <Stack gap="1">
          {cluster.lastMaintenance.state === "Error" ? <Icon icon="error" color="tw-text-theme-error" /> : null}
          {cluster.version}
        </Stack>
      </DataGridCell>
      <DataGridCell>
        <Link to="/clusters/$clusterName" params={{ clusterName: cluster.name }}>
          <Button label="View Details" variant="primary" size="small" />
        </Link>
      </DataGridCell>
    </DataGridRow>
  )
}

export default ClusterListItem
