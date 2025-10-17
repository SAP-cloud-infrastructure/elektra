// components/JobList.tsx
import { Job } from "../../../types/job"
import { JobItem } from "./JobItem"
import React from "react"
import {
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Spinner,
  Breadcrumb,
  BreadcrumbItem,
} from "@cloudoperators/juno-ui-components"
import { useRouter } from "@tanstack/react-router"

interface JobListProps {
  jobs: Job[]
  isLoading?: boolean
}

const Navigation = () => {
  const router = useRouter()
  return (
    <Breadcrumb>
      <BreadcrumbItem icon="home" label="" />
      <BreadcrumbItem
        label="Jobs"
        onClick={
          // reload the jobs list
          async () => await router.invalidate()
        }
      />
    </Breadcrumb>
  )
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
              <span role="status">No Jobs found, nothing to do 👍</span>
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
