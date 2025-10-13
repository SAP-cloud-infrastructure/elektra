// components/JobItem.tsx
import { useNavigate } from "@tanstack/react-router"
import { Job } from "../../types/job"
import { getStatusColor, formatDate } from "./utils/jobUtils"
import React from "react"
import { DataGridRow, DataGridCell, Button, Badge, Stack } from "@cloudoperators/juno-ui-components"

interface JobItemProps {
  job: Job
}

export function JobItem({ job }: JobItemProps) {
  const navigate = useNavigate()

  const handleJobClick = () => {
    navigate({ search: { jobId: job.id } })
  }

  return (
    <DataGridRow>
      <DataGridCell>
        <button onClick={handleJobClick}>{job.name}</button>
      </DataGridCell>
      <DataGridCell>
        <Stack direction="horizontal" gap="1">
          <Badge variant={`${getStatusColor(job.state)}`}>{job.state}</Badge>
        </Stack>
      </DataGridCell>
      <DataGridCell>{job.description || "No description"}</DataGridCell>
      <DataGridCell>{formatDate(job.schedule_date)}</DataGridCell>
      <DataGridCell>
        {(job.state === "initial" || job.state === "scheduled") && (
          <Button variant="primary" size="small">
            Schedule
          </Button>
        )}
      </DataGridCell>
    </DataGridRow>
  )
}
