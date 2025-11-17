import React from "react"
import { Worker } from "../../../types/cluster"
import { DataGridRow, DataGridCell, Stack } from "@cloudoperators/juno-ui-components"

interface WorkerListItemProps {
  worker: Worker
}

const WorkerListItem: React.FC<WorkerListItemProps> = ({ worker, ...props }) => {
  return (
    <DataGridRow {...props}>
      <DataGridCell>{worker.name}</DataGridCell>
      <DataGridCell>{worker.architecture}</DataGridCell>
      <DataGridCell>{worker.machineType}</DataGridCell>
      <DataGridCell>
        <Stack direction="horizontal" gap="1">
          <span>{worker.machineImage.name}</span>
          <span>/</span>
          <span>{worker.machineImage.version}</span>
        </Stack>
      </DataGridCell>
      <DataGridCell>
        <Stack direction="horizontal" gap="1">
          <span>Min {worker.min}</span>
          <span>/</span>
          <span>Max {worker.max}</span>
          <span>/</span>
          <span>Surge {worker.maxSurge}</span>
        </Stack>
      </DataGridCell>
    </DataGridRow>
  )
}

export default WorkerListItem
