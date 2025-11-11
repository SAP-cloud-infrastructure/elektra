import React from "react"
import { Cluster } from "../../../types/cluster"
import { DataGridRow, DataGridCell, Icon, Stack, Button } from "@cloudoperators/juno-ui-components"
import ReadinessConditions from "../../../components/ReadinessConditions"
import ClipboardText from "../../../components/ClipboardText"
import { Link } from "@tanstack/react-router"

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "operational":
    case "running":
      return {
        color: "tw-text-theme-success",
        icon: "checkCircle" as const,
      }
    case "warning":
    case "pending":
      return {
        color: "tw-text-theme-warning",
        icon: "warning" as const,
      }
    case "unhealthy":
    case "error":
    case "failed":
      return {
        color: "tw-text-theme-error",
        icon: "dangerous" as const,
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
  const statusStyles = getStatusStyles(cluster.status)

  return (
    <DataGridRow {...props}>
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
        <Stack direction="vertical" className="tw-whitespace-nowrap">
          <p className="tw-font-bold">{cluster.name}</p>
          <ClipboardText text={cluster.uid} />
        </Stack>
      </DataGridCell>
      <DataGridCell>
        <ReadinessConditions conditions={cluster.readiness.conditions} />
      </DataGridCell>
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
