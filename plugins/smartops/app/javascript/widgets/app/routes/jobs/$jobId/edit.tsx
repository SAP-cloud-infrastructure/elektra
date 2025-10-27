import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import type { ApiResponse } from "../../../types/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  Spinner,
  Form,
  FormSection,
  Button,
  Message,
  DateTimePicker,
  ButtonRow,
} from "@cloudoperators/juno-ui-components"

export const Route = createFileRoute("/jobs/$jobId/edit")({
  component: EditJob,
  pendingComponent: () => <Spinner size="small" aria-label="Loading Job for Edit" />,
  loader: async ({ context, params }) => {
    const client = context.apiClient
    if (!client) {
      throw new Error("API client is undefined")
    }
    const response = await client.get<ApiResponse>(`/jobs/${params.jobId}`)
    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to fetch job details")
    }
    const job = response.data.job
    if (!job) {
      throw new Error("Job not found")
    }
    return { job }
  },
})

function EditJob() {
  const { job } = Route.useLoaderData()
  const navigate = useNavigate()
  const [scheduleDate, setScheduleDate] = useState(job.schedule_date || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { apiClient: client } = Route.useRouteContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!client) {
        throw new Error("API client is undefined")
      }

      const response = await client.patch<ApiResponse>(`/jobs/${job.id}`, {
        schedule_date: scheduleDate,
      })

      if (!response.data.success) {
        console.log("API Error Response:", response.data.error)
        throw new Error(response.data.error?.message || "Failed to update job")
      }

      setSuccess(true)
      // Navigate back to job details after a short delay
      setTimeout(() => {
        navigate({ to: "/jobs/$jobId", params: { jobId: job.id } })
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem icon="home" label="" disabled />
        <BreadcrumbItem label="Jobs" onClick={() => navigate({ to: "/jobs" })} />
        <BreadcrumbItem label={job.name} onClick={() => navigate({ to: "/jobs/$jobId", params: { jobId: job.id } })} />
        <BreadcrumbItem label="Edit" disabled />
      </Breadcrumb>

      {error && (
        <Message variant="error" className="mb-4">
          {error}
        </Message>
      )}

      {success && (
        <Message variant="success" className="mb-4">
          Job updated successfully! Redirecting...
        </Message>
      )}

      <Form onSubmit={handleSubmit}>
        <FormSection title={`Set Schedule Date for Job ${job.name}`}>
          <div className="grid gap-4">
            <DateTimePicker
              label="Select the date and time to schedule the job."
              helptext={`Schedule Date not later as for job due by ${new Date(job.due_date).toLocaleDateString()}`}
              value={scheduleDate}
              onChange={(selectedDate) => {
                const currentDate = new Date()
                // Handle both string and array values
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
                  return
                } else if (selectedDateTime > dueDateTime) {
                  setError(`Schedule Date not later as for job due by ${new Date(job.due_date).toLocaleDateString()}`)
                  return
                } else {
                  setError(null)
                  selectedDateTime.setHours(23, 59, 59)
                  console.log("Selected Schedule Date:", selectedDateTime.toISOString())
                  setScheduleDate(selectedDateTime.toISOString())
                }
              }}
            />
          </div>
        </FormSection>
        <ButtonRow>
          <Button label="Schedule" onClick={handleSubmit} variant="primary" disabled={isLoading || !scheduleDate} />
          <Button label="Cancel" onClick={() => navigate({ to: "/jobs" })} />
        </ButtonRow>
      </Form>
    </>
  )
}
