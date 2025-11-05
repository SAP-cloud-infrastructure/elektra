// components/JobDetails.tsx
import type { Job } from "../../../types/api"
import type { ApiResponse } from "../../../types/api"
import { getStatusColor, formatDate, formatScheduleDate } from "./utils/jobUtils"
import {
  Icon,
  Stack,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  DateTimePicker,
  Message,
  Badge,
  Button,
  ButtonRow,
  Form,
} from "@cloudoperators/juno-ui-components"
import { useState } from "react"
import { AjaxHelper } from "lib/ajax_helper"

interface JobDetailsProps {
  job: Job
  domainName?: string
  projectName?: string
  apiClient?: AjaxHelper
}

const objectLink = (job: Job, domainName?: string, projectName?: string) => {
  if (job.object_type && job.object_id) {
    if (job.object_type === "server") {
      return `/${domainName}/${projectName}/compute/instances?overlay=${job.object_id}`
    }
  }
  return null
}

export function JobDetails({ job, domainName, projectName, apiClient }: JobDetailsProps) {
  const jobState = job.state || "unknown"
  const [error, setError] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState(job.schedule_date || "")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!apiClient) {
        throw new Error("API client is undefined")
      }

      const response = await apiClient.patch<ApiResponse>(`/jobs/${job.id}`, {
        schedule_date: scheduleDate,
      })

      if (!response.data.success) {
        throw new Error(response.data.error?.message || "Failed to update job")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
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
          <DataGridCell>{job.due_date ? formatDate(job.due_date) : "No due date!!!"}</DataGridCell>
        </DataGridRow>
        <DataGridRow>
          <DataGridCell>
            <strong>Schedule Date</strong>
          </DataGridCell>
          <DataGridCell>
            {error && (
              <Message variant="error" className="mb-4">
                {error}
              </Message>
            )}

            {success && (
              <Message variant="success" className="mb-4">
                Job updated successfully!
              </Message>
            )}
            {new Date(job.due_date) < new Date() && !job.schedule_date ? (
              <Message variant="error" className="mb-4">
                Job missed its scheduled time and can no longer be scheduled
              </Message>
            ) : new Date(job.due_date) < new Date() && job.schedule_date && job.state != "successful" ? (
              <>
                <Message variant="error" className="mb-4">
                  Job was scheduled but did not complete successfully before due date!
                </Message>
                {formatScheduleDate(job, true)}
              </>
            ) : job.state !== "initial" && job.state !== "scheduled" ? (
              formatScheduleDate(job, true)
            ) : (
              <>
                <Form onSubmit={handleSubmit}>
                  <DateTimePicker
                    label="Select the date and time to schedule the job."
                    helptext={`Schedule Date not later as for job due by ${new Date(job.due_date).toLocaleDateString()}`}
                    value={scheduleDate}
                    enableTime={true}
                    onChange={(selectedDate) => {
                      const currentDate = new Date()
                      // Handle both string and array values
                      console.log("Selected date:", selectedDate) // Debug log
                      const dateValue = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate
                      if (!dateValue) {
                        return
                      }
                      const selectedDateTime = new Date(dateValue)
                      const dueDateTime = new Date(job.due_date)
                      if (isNaN(selectedDateTime.getTime())) {
                        return
                      } else if (selectedDateTime < currentDate) {
                        setError("Selected date is in the past")
                        console.log("Selected date is in the past") // Debug log
                        return
                      } else if (selectedDateTime > dueDateTime) {
                        setError(
                          `Schedule Date not later as for job due by ${new Date(job.due_date).toLocaleDateString()}`
                        )
                        return
                      } else {
                        setError(null)
                        setScheduleDate(selectedDateTime.toISOString())
                      }
                    }}
                  />
                </Form>
                <ButtonRow>
                  <Button
                    label="Schedule"
                    onClick={handleSubmit}
                    size="small"
                    variant="primary"
                    disabled={isLoading || !scheduleDate || !!error}
                  />
                </ButtonRow>
              </>
            )}
          </DataGridCell>
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
    </>
  )
}
