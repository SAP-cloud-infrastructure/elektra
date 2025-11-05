// jobs/-components/JobItem.tsx
import { useNavigate } from "@tanstack/react-router"
import type { Job } from "../../../types/api"
import { getStatusColor, formatScheduleDate } from "./utils/jobUtils"
import { DataGridRow, DataGridCell, Badge, Stack } from "@cloudoperators/juno-ui-components"

interface JobItemProps {
  job: Job
}

export function JobItem({ job }: JobItemProps) {
  const navigate = useNavigate()

  const handleJobClick = () => {
    console.log("Job clicked:", job.id) // Debug log
    navigate({
      to: "/jobs",
      search: { jobId: job.id },
    })
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
      <DataGridCell>{new Date(job.due_date).toLocaleString()}</DataGridCell>
      <DataGridCell>{formatScheduleDate(job)}</DataGridCell>
    </DataGridRow>
  )
}
