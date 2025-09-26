import React from "react"
import { Cluster } from "../../../types/clusters"
import { DataGrid, DataGridRow, DataGridHeadCell, DataGridCell, Icon } from "@cloudoperators/juno-ui-components"
import ClusterListItem from "./ClusterListItem"

const NUMBER_OF_COLUMNS = 6

const ClusterList: React.FC<{
  clusters: Cluster[]
}> = ({ clusters, ...props }) => {
  return (
    <div className="datagrid-hover" data-testid="cluster-list" {...props}>
      <DataGrid minContentColumns={[0]} columns={NUMBER_OF_COLUMNS}>
        <DataGridRow>
          <DataGridHeadCell>
            <Icon icon="monitorHeart" data-testid="icon-monitorHeart" />
          </DataGridHeadCell>
          <DataGridHeadCell>Status</DataGridHeadCell>
          <DataGridHeadCell>Name</DataGridHeadCell>
          <DataGridHeadCell>Readiness</DataGridHeadCell>
          <DataGridHeadCell>Version</DataGridHeadCell>
          <DataGridHeadCell></DataGridHeadCell>
        </DataGridRow>
        {clusters.length === 0 ? (
          <DataGridRow>
            <DataGridCell colSpan={NUMBER_OF_COLUMNS}>No clusters found</DataGridCell>
          </DataGridRow>
        ) : (
          clusters.map((cluster) => <ClusterListItem key={cluster.uid} cluster={cluster} />)
        )}
      </DataGrid>
    </div>
  )
}

export default ClusterList
