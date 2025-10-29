// components/JobDetails.tsx
import type { Job } from "../../../types/api"
import { getStatusColor, formatDate, scheduleDate } from "./utils/jobUtils"
import {
  Icon,
  Stack,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Badge,
} from "@cloudoperators/juno-ui-components"

interface JobDetailsProps {
  job: Job
  domainName?: string
  projectName?: string
}

const objectLink = (job: Job, domainName?: string, projectName?: string) => {
  if (job.object_type && job.object_id) {
    if (job.object_type === "server") {
      return `/${domainName}/${projectName}/compute/instances?overlay=${job.object_id}`
    }
  }
  return null
}

export function JobDetails({ job, domainName, projectName }: JobDetailsProps) {
  const jobState = job.state || "unknown"
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
            <Badge variant={getStatusColor(jobState)}>{jobState}</Badge>
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
          <strong>Due Date</strong>
        </DataGridCell>
        <DataGridCell>{job.due_date ? formatDate(job.due_date) : "No due date"}</DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Schedule Date</strong>
        </DataGridCell>
        <DataGridCell>{scheduleDate(job, true)}</DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Type</strong>
        </DataGridCell>
        <DataGridCell>{job.object_type || "No type"}</DataGridCell>
      </DataGridRow>
      <DataGridRow>
        <DataGridCell>
          <strong>Object ID</strong>
        </DataGridCell>
        <DataGridCell>
          {job.object_id ? (
            objectLink(job, domainName, projectName) ? (
              <Stack gap="2" direction="horizontal">
                <div>{job.object_id}</div>
                <Icon
                  color="jn-global-text"
                  icon="openInNew"
                  href={objectLink(job, domainName, projectName) || undefined}
                  target="_blank"
                  title={`Jump to ${job.object_type}`}
                />
              </Stack>
            ) : (
              job.object_id
            )
          ) : (
            "No object"
          )}
        </DataGridCell>
      </DataGridRow>
    </DataGrid>
  )
}
