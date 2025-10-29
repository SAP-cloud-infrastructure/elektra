// components/JobItem.tsx
import { useNavigate } from "@tanstack/react-router"
import type { Job } from "../../../types/api"
import { getStatusColor, scheduleDate } from "./utils/jobUtils"
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

  const handleScheduleClick = (event: React.MouseEvent) => {
    event.stopPropagation() // Prevents the row click event from firing
  }

  const jobState = job.state || "unknown"
  return (
    <DataGridRow onClick={handleJobClick} style={{ cursor: "pointer" }}>
      <DataGridCell>{job.name}</DataGridCell>
      <DataGridCell>
        <Stack direction="horizontal" gap="1">
          <Badge variant={`${getStatusColor(jobState)}`}>{jobState}</Badge>
        </Stack>
      </DataGridCell>
      <DataGridCell>{job.description || "No description"}</DataGridCell>
      <DataGridCell>{scheduleDate(job)}</DataGridCell>
      <DataGridCell>
        {(jobState === "initial" || jobState === "scheduled") && (
          <Button variant="primary" size="small" href={`jobs/${job.id}/edit`} onClick={handleScheduleClick}>
            Schedule
          </Button>
        )}
      </DataGridCell>
    </DataGridRow>
  )
}
