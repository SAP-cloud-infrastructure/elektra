// components/JobList.tsx
import { Job } from "../../types/job" // Adjust import path as needed
import { JobItem } from "./JobItem"
import React from "react"
import { DataGrid, DataGridRow, DataGridHeadCell, DataGridCell } from "@cloudoperators/juno-ui-components"

interface JobListProps {
  jobs: Job[]
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

export function JobList({ jobs }: JobListProps) {
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
