import { Stack, Badge } from "@cloudoperators/juno-ui-components"
import { Job } from "../../../../types/api"

export const getStatusColor = (state: string) => {
  switch (state) {
    case "initial":
      return "default"
    case "scheduled":
      return "info"
    case "pending":
      return "warning"
    case "waiting":
      return "warning"
    case "running":
      return "info"
    case "successful":
      return "success"
    case "error":
      return "error"
    case "reset":
      return "warning"
    case "canceled":
      return "error"
    default:
      return "warning"
  }
}

export const formatScheduleDate = (job: Job) => {
  // check current data behind due_date than show warning message
  if (new Date(job.due_date) <= new Date() && !job.schedule_date) {
    return (
      <Stack gap="2" direction="horizontal">
        <Badge variant="warning">Due date has passed</Badge>
      </Stack>
    )
  }

  return job.schedule_date ? (
    formatDate(job.schedule_date)
  ) : (
    <Stack gap="2" direction="horizontal">
      <Badge variant="warning">No schedule date</Badge>
    </Stack>
  )
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) + ' UTC'
}
