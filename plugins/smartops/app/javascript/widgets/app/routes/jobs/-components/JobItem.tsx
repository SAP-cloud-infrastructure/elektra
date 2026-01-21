import type { Job } from "../../../types/api"
import { getStatusColor, formatScheduleDate } from "./utils/jobUtils"
import { DataGridRow, DataGridCell, Badge, Stack, Button } from "@cloudoperators/juno-ui-components"

interface JobItemProps {
  job: Job
  onSelect?: (jobId: string) => void //to handle select and onClose if job is already selected
}

export function JobItem({ job, onSelect }: JobItemProps) {
  const handleJobClick = () => {
    if (onSelect) {
      onSelect(job.id)
    }
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
      <DataGridCell>
        <Button
          variant="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            handleJobClick()
          }}
        >
          Details
        </Button>
      </DataGridCell>
    </DataGridRow>
  )
}
