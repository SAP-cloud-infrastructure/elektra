// components/JobItem.tsx
import { Link } from "@tanstack/react-router"
import { Job } from "../../types/job" // Adjust import path as needed
import React from "react"
import { DataGridRow, DataGridCell, Button } from "@cloudoperators/juno-ui-components"

interface JobItemProps {
  job: Job
}

export function JobItem({ job }: JobItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case "successful":
        return "tw-text-theme-success"
      case "failed":
        return "tw-text-theme-error"
      case "running":
        return "tw-text-theme-info"
      case "pending":
        return "tw-text-theme-warning"
      default:
        return "tw-text-theme-warning"
    }
  }

  return (
    <DataGridRow>
      <DataGridCell>
        <Link to="/show" params={{ jobId: job.id }}>
          {job.name}
        </Link>
      </DataGridCell>
      <DataGridCell>
        <span className={`${getStatusColor(job.state)}`}>{job.state}</span>
      </DataGridCell>
      <DataGridCell>{job.description || "No description"}</DataGridCell>
      <DataGridCell>{formatDate(job.schedule_date)}</DataGridCell>
      <DataGridCell>
        <Button>Schedule</Button>
      </DataGridCell>
    </DataGridRow>
  )
}
