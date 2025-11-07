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
} from "@cloudoperators/juno-ui-components"
import ClusterListItem from "./ClusterListItem"
import InlineError from "../../../components/InlineError"

const NUMBER_OF_COLUMNS = 6

const ClusterListHeader = () => (
  <DataGridRow>
    <DataGridHeadCell>
      <Icon icon="monitorHeart" data-testid="icon-monitorHeart" />
    </DataGridHeadCell>
    <DataGridHeadCell>Status</DataGridHeadCell>
    <DataGridHeadCell>Name</DataGridHeadCell>
    <DataGridHeadCell>Readiness</DataGridHeadCell>
    <DataGridHeadCell>Version</DataGridHeadCell>
    <DataGridHeadCell />
  </DataGridRow>
)

interface ClusterListProps {
  clusters?: Cluster[]
  isLoading?: boolean
  error?: Error
  updatedAt?: number
}

const ClusterList: React.FC<ClusterListProps> = ({ clusters = [], error, isLoading, updatedAt, ...props }) => {
  const hoverClass = isLoading || error || clusters.length === 0 ? "" : "datagrid-hover"

  const renderContent = () => {
    if (isLoading) {
      return (
        <DataGridRow>
          <DataGridCell colSpan={NUMBER_OF_COLUMNS}>
            <Spinner size="small" aria-label="Loading clusters" data-testid="clusters-list-loading-state" />
          </DataGridCell>
        </DataGridRow>
      )
    }

    if (error) {
      return (
        <DataGridRow>
          <DataGridCell colSpan={NUMBER_OF_COLUMNS}>
            <InlineError error={error} data-testid="clusters-list-error-state" />
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
    <div className={hoverClass} data-testid="cluster-list" {...props}>
      {updatedAt && (
        <Stack alignment="center" distribution="end" className="tw-mb-2 tw-text-sm" data-testid="clusters-updated-at">
          <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>
        </Stack>
      )}
      <DataGrid minContentColumns={[0]} columns={NUMBER_OF_COLUMNS}>
        <ClusterListHeader />
        {renderContent()}
      </DataGrid>
    </div>
  )
}

export default ClusterList
