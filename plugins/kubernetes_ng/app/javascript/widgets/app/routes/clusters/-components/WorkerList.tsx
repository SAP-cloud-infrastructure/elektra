import React from "react"
import { DataGrid, DataGridRow, DataGridHeadCell, DataGridCell, Icon } from "@cloudoperators/juno-ui-components"
import { Worker } from "../../../types/cluster"
import WorkerListItem from "./WorkerListItem"

const NUMBER_OF_COLUMNS = 5

const WorkerList: React.FC<{
  workers: Worker[]
}> = ({ workers, ...props }) => {
  return (
    <div className="datagrid-hover" data-testid="worker-list" {...props}>
      <DataGrid columns={NUMBER_OF_COLUMNS}>
        <DataGridRow>
          <DataGridHeadCell>Name</DataGridHeadCell>
          <DataGridHeadCell>Architecture</DataGridHeadCell>
          <DataGridHeadCell>Type</DataGridHeadCell>
          <DataGridHeadCell>Image/Version</DataGridHeadCell>
          <DataGridHeadCell>Scaling</DataGridHeadCell>
        </DataGridRow>
        {workers.length === 0 ? (
          <DataGridRow>
            <DataGridCell colSpan={NUMBER_OF_COLUMNS}>No workers found</DataGridCell>
          </DataGridRow>
        ) : (
          <>
            {workers.map((worker) => (
              <WorkerListItem key={worker.name} worker={worker} />
            ))}
          </>
        )}
      </DataGrid>
    </div>
  )
}

export default WorkerList
