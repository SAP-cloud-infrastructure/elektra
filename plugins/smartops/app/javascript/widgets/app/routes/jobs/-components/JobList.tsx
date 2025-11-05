// jobs/-components/JobList.tsx
import type { Job } from "../../../types/api"
import { JobItem } from "./JobItem"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Spinner,
  Breadcrumb,
  BreadcrumbItem,
} from "@cloudoperators/juno-ui-components"

interface JobListProps {
  jobs: Job[]
  isLoading?: boolean
}

const Navigation = () => {
  return (
    <Breadcrumb>
      <BreadcrumbItem icon="home" label="" disabled />
      <BreadcrumbItem label="Jobs" />
    </Breadcrumb>
  )
}

const JobsListHeader = () => (
  <DataGridRow>
    <DataGridHeadCell>Name</DataGridHeadCell>
    <DataGridHeadCell>Status</DataGridHeadCell>
    <DataGridHeadCell>Description</DataGridHeadCell>
    <DataGridHeadCell>Due Date</DataGridHeadCell>
    <DataGridHeadCell>Schedule Date</DataGridHeadCell>
  </DataGridRow>
)

export function JobList({ jobs, isLoading }: JobListProps) {
  // Remove the search hook since we don't need it here anymore
  // If you want to highlight selected job, you can pass it as a prop instead

  if (isLoading) {
    return (
      <>
        <Navigation />
        <DataGrid columns={5} minContentColumns={[5]}>
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
        <Navigation />
        <DataGrid columns={5} minContentColumns={[5]}>
          <JobsListHeader />
          <DataGridRow>
            <DataGridCell>
              <span role="status">No Jobs found, nothing to do �👍</span>
            </DataGridCell>
          </DataGridRow>
        </DataGrid>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <DataGrid columns={5} minContentColumns={[5]}>
        <JobsListHeader />
        {jobs.map((job) => (
          <JobItem key={job.id} job={job} />
        ))}
      </DataGrid>
    </>
  )
}
