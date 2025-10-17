import { createFileRoute } from "@tanstack/react-router"
import { Job } from "../../types/job"
import React from "react"
import { getStatusColor, formatDate } from "./-components/utils/jobUtils"
import {
  Stack,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Badge,
  Spinner,
} from "@cloudoperators/juno-ui-components"

export const Route = createFileRoute("/jobs/$jobId")({
  component: Details,
  pendingComponent: () => <Spinner size="small" aria-label="Loading Job Details" />,
  loader: async ({ context, params }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }
    const response = await client.get<{ data: Job[] }>(`/jobs/${params.jobId}`)
    const [job] = response.data // takes the first job from the response

    if (!job) {
      throw new Error("Job not found")
    }
    return { job }
  },
})

function Details() {
  console.log("Rendering Job Details component")
  const { job } = Route.useLoaderData()
  console.log("Job details loaded:", job)

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

export default Details
