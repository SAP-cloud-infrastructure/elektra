// components/JobItem.tsx
import { useNavigate } from "@tanstack/react-router"
import type { Job } from "../../../types/api"
import { getStatusColor, formatDate } from "./utils/jobUtils"
import { DataGridRow, DataGridCell, Button, Badge, Stack } from "@cloudoperators/juno-ui-components"

interface JobItemProps {
  job: Job
}

export function JobItem({ job }: JobItemProps) {
  const navigate = useNavigate()

  const handleJobClick = () => {
    navigate({
      to: `/jobs/${job.id}`,
    })
  }

  const jobState = job.state || "unknown"
  return (
    <DataGridRow>
      <DataGridCell>
        <button onClick={handleJobClick}>{job.name}</button>
      </DataGridCell>
      <DataGridCell>
        <Stack direction="horizontal" gap="1">
          <Badge variant={`${getStatusColor(jobState)}`}>{jobState}</Badge>
        </Stack>
      </DataGridCell>
      <DataGridCell>{job.description || "No description"}</DataGridCell>
      <DataGridCell>{job.schedule_date ? formatDate(job.schedule_date) : "No schedule date"}</DataGridCell>
      <DataGridCell>
        {(jobState === "initial" || jobState === "scheduled") && (
          <Button variant="primary" size="small" href={`jobs/${job.id}/edit`}>
            Schedule
          </Button>
        )}
      </DataGridCell>
    </DataGridRow>
  )
}
