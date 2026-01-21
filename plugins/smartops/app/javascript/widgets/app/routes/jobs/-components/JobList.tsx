import type { Job } from "../../../types/api"
import { JobItem } from "./JobItem"
import { DataGrid, DataGridRow, DataGridHeadCell, DataGridCell, Spinner } from "@cloudoperators/juno-ui-components"

interface JobListProps {
  jobs: Job[]
  isLoading?: boolean
  onJobSelect?: (jobId: string) => void
}

const JobsListHeader = () => (
  <DataGridRow>
    <DataGridHeadCell>Name</DataGridHeadCell>
    <DataGridHeadCell>Status</DataGridHeadCell>
    <DataGridHeadCell>Description</DataGridHeadCell>
    <DataGridHeadCell>Due Date</DataGridHeadCell>
    <DataGridHeadCell>Schedule Date</DataGridHeadCell>
    <DataGridHeadCell></DataGridHeadCell>
  </DataGridRow>
)

export function JobList({ jobs, isLoading, onJobSelect }: JobListProps) {
  if (isLoading) {
    return (
      <>
        <DataGrid columns={6} minContentColumns={[6]}>
          <JobsListHeader />
          <DataGridRow>
            <DataGridCell>
              <Spinner size="small" aria-label="Loading Jobs" />
            </DataGridCell>
          </DataGridRow>
        </DataGrid>
      </>
    )
  }

  if (jobs.length === 0) {
    return (
      <>
        <DataGrid columns={6} minContentColumns={[6]}>
          <JobsListHeader />
          <DataGridRow>
            <DataGridCell>
              <span role="status">No Jobs found, nothing to do 👍</span>
            </DataGridCell>
          </DataGridRow>
        </DataGrid>
      </>
    )
  }

  return (
    <div className="datagrid-hover">
      <DataGrid columns={6} minContentColumns={[6]}>
        <JobsListHeader />
        {jobs.map((job) => (
          <JobItem key={job.id} job={job} onSelect={onJobSelect} />
        ))}
      </DataGrid>
    </div>
  )
}
