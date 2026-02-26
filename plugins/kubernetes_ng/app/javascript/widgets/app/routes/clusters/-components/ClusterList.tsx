import React from "react"
import { Cluster } from "../../../types/cluster"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Icon,
  Spinner,
  Stack,
  Button,
  DataGridToolbar,
} from "@cloudoperators/juno-ui-components"
import ClusterListItem from "./ClusterListItem"
import InlineError from "../../../components/InlineError"

const NUMBER_OF_COLUMNS = 7

const ClusterListHeader = () => (
  <DataGridRow>
    <DataGridHeadCell>
      <Icon icon="monitorHeart" />
    </DataGridHeadCell>
    <DataGridHeadCell>Status</DataGridHeadCell>
    <DataGridHeadCell>Name</DataGridHeadCell>
    <DataGridHeadCell>Readiness</DataGridHeadCell>
    <DataGridHeadCell>Last Operation</DataGridHeadCell>
    <DataGridHeadCell>Version</DataGridHeadCell>
    <DataGridHeadCell />
  </DataGridRow>
)

interface ClusterListProps {
  clusters?: Cluster[]
  isLoading?: boolean
  error?: Error
  updatedAt?: number
  isFetching?: boolean
  onRefresh?: () => void
}

const ClusterList: React.FC<ClusterListProps> = ({
  clusters = [],
  error,
  isLoading,
  updatedAt,
  isFetching = false,
  onRefresh,
  ...props
}) => {
  const hoverClass = isLoading || error || clusters.length === 0 ? "" : "datagrid-hover"

  const renderContent = () => {
    if (isLoading) {
      return (
        <DataGridRow>
          <DataGridCell colSpan={NUMBER_OF_COLUMNS}>
            <Stack gap="2">
              <Spinner variant="primary" size="small" aria-label="Loading cluster details" />
              <span>Loading clusters...</span>
            </Stack>
          </DataGridCell>
        </DataGridRow>
      )
    }

    if (error) {
      return (
        <DataGridRow>
          <DataGridCell colSpan={NUMBER_OF_COLUMNS}>
            <InlineError error={error} />
          </DataGridCell>
        </DataGridRow>
      )
    }

    if (clusters.length === 0) {
      return (
        <DataGridRow>
          <DataGridCell colSpan={NUMBER_OF_COLUMNS}>
            <span role="status">No clusters found</span>
          </DataGridCell>
        </DataGridRow>
      )
    }

    return clusters.map((cluster) => <ClusterListItem key={cluster.uid} cluster={cluster} />)
  }

  return (
    <div className={hoverClass} {...props}>
      <DataGridToolbar>
        <Stack alignment="center" distribution="end" className="tw-text-sm tw-gap-4">
          <>
            {updatedAt && <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>}
            {onRefresh && (
              <Button
                size="small"
                variant="subdued"
                onClick={onRefresh}
                progress={isFetching}
                disabled={isFetching}
                label="Refresh"
                title="Refresh clusters data"
              />
            )}
          </>
        </Stack>
      </DataGridToolbar>
      <DataGrid minContentColumns={[0]} columns={NUMBER_OF_COLUMNS} aria-label="Cluster list">
        <ClusterListHeader />
        {renderContent()}
      </DataGrid>
    </div>
  )
}

export default ClusterList
