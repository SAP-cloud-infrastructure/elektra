import React from "react"
import {
  Icon,
  Stack,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Container,
  Button,
} from "@cloudoperators/juno-ui-components"
import Card from "../../../components/Card"
import { Cluster } from "../../../types/clusters"
import ClipboardText from "../../../components/ClipboardText"
import { Link } from "@tanstack/react-router"
import RedinessConditions from "../../../components/RedinessConditions"

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "operational":
    case "running":
      return {
        color: "tw-text-theme-accent",
        icon: "success" as const,
      }
    case "warning":
    case "pending":
      return {
        color: "tw-text-theme-warning",
        icon: "info" as const,
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
        color: "tw-text-theme-default",
        icon: "help" as const,
      }
  }
}

const ClusterCard: React.FC<{
  cluster: Cluster
}> = ({ cluster }) => {
  const statusStyles = getStatusStyles(cluster.status)

  return (
    <>
      <Card className="tw-w-full" padding data-card="cluster-card">
        {/* card header */}
        <div>
          <Stack direction="vertical" gap="2">
            <Stack>
              {/* Status + name*/}
              <Stack alignment="center" gap="2" className="tw-w-full">
                <Icon
                  color={statusStyles.color}
                  size={18}
                  icon={statusStyles.icon}
                  data-status-icon="status-icon"
                  data-icon={statusStyles.icon}
                  data-color={statusStyles.color}
                />
                <div className="tw-font-bold tw-text-lg">{cluster.name}</div>
              </Stack>
              <Stack gap="2" direction="horizontal" className="tw-whitespace-nowrap">
                {/* Actions */}
                <Link to="/clusters/$clusterName" params={{ clusterName: cluster.name }}>
                  <Button label="View Details" variant="primary" size="small" />
                </Link>
              </Stack>
            </Stack>
            {/* Readiness conditions */}
            <RedinessConditions conditions={cluster.readiness.conditions} />
          </Stack>
        </div>

        {/* Basic info */}
        <Container py px={false}>
          <DataGrid columns={2} gridColumnTemplate="20% auto">
            <DataGridRow>
              <DataGridHeadCell>ID</DataGridHeadCell>
              <DataGridCell>
                <Stack gap="1" direction="horizontal" wrap>
                  <ClipboardText text={cluster.uid} className="tw-ml-2" />
                </Stack>
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Kubernetes Version</DataGridHeadCell>
              <DataGridCell>
                <Stack gap="1" direction="horizontal" wrap>
                  {cluster.version}
                </Stack>
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Purpose</DataGridHeadCell>
              <DataGridCell>
                <Stack gap="1" direction="horizontal" wrap>
                  {cluster.purpose}
                </Stack>
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Infrastructure</DataGridHeadCell>
              <DataGridCell>
                <Stack gap="1" direction="horizontal" wrap>
                  {cluster.infrastructure}
                </Stack>
              </DataGridCell>
            </DataGridRow>
          </DataGrid>
        </Container>
      </Card>
    </>
  )
}

export default ClusterCard
