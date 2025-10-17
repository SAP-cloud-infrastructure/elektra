// components/JobDetails.tsx
import React from "react"
import { Job } from "../../../types/job"
import { getStatusColor, formatDate } from "./utils/jobUtils"
import { Stack, DataGrid, DataGridRow, DataGridHeadCell, DataGridCell, Badge } from "@cloudoperators/juno-ui-components"

interface JobDetailsProps {
  job: Job
}

export function JobDetails({ job }: JobDetailsProps) {
  return (
    <DataGrid columns={2}>
      <DataGridRow>
        <DataGridHeadCell>Property</DataGridHeadCell>
        <DataGridHeadCell>Value</DataGridHeadCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>ID</strong>
        </DataGridCell>
        <DataGridCell>{job.id}</DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Name</strong>
        </DataGridCell>
        <DataGridCell>{job.name}</DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Status</strong>
        </DataGridCell>
        <DataGridCell>
          <Stack direction="horizontal" gap="1">
            <Badge variant={getStatusColor(job.state)}>{job.state}</Badge>
          </Stack>
        </DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Description</strong>
        </DataGridCell>
        <DataGridCell>{job.description || "No description"}</DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Schedule Date</strong>
        </DataGridCell>
        <DataGridCell>{formatDate(job.schedule_date)}</DataGridCell>
      </DataGridRow>
    </DataGrid>
  )
}
