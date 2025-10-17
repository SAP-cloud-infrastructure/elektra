// components/JobList.tsx
import { Job } from "../../../types/job"
import { JobItem } from "./JobItem"
import React from "react"
import { DataGrid, DataGridRow, DataGridHeadCell, DataGridCell, Spinner } from "@cloudoperators/juno-ui-components"

interface JobListProps {
  jobs: Job[]
  isLoading?: boolean
}

const JobsListHeader = () => (
  <DataGridRow>
    <DataGridHeadCell>Name</DataGridHeadCell>
    <DataGridHeadCell>Status</DataGridHeadCell>
    <DataGridHeadCell>Description</DataGridHeadCell>
    <DataGridHeadCell>Schedule Date</DataGridHeadCell>
    <DataGridHeadCell></DataGridHeadCell>
  </DataGridRow>
)

export function JobList({ jobs, isLoading }: JobListProps) {
  if (isLoading) {
    return (
      <DataGrid columns={5} minContentColumns={[5]}>
        <JobsListHeader />
        <DataGridRow>
          <DataGridCell>
            <Spinner size="small" aria-label="Loading Jobs" />
          </DataGridCell>
        </DataGridRow>
      </DataGrid>
    )
  }

  if (jobs.length === 0) {
    return (
      <DataGrid columns={5} minContentColumns={[5]}>
        <JobsListHeader />
        <DataGridRow>
          <DataGridCell>
            <span role="status">No Jobs found, nothing to do 👍</span>
          </DataGridCell>
        </DataGridRow>
      </DataGrid>
    )
  }

  return (
    <DataGrid columns={5} minContentColumns={[5]}>
      <JobsListHeader />
      {jobs.map((job) => (
        <JobItem key={job.id} job={job} />
      ))}
    </DataGrid>
  )
}
