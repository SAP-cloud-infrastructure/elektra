// utils/jobUtils.ts
import { Stack, Badge, Icon } from "@cloudoperators/juno-ui-components"
import { Job } from "../../../../types/api"

export const getStatusColor = (state: string) => {
  switch (state) {
    case "initial":
      return "info"
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

export const scheduleDate = (job: Job, details?: boolean) => {
  // check current data behind due_date than show warning message
  if (new Date(job.due_date) < new Date() && !job.schedule_date) {
    return (
      <Stack gap="2" direction="horizontal">
        <Badge variant="warning">Due date has passed</Badge>
        {details && (
          <Icon color="jn-global-text" icon="edit" href={`jobs/${job.id}/edit`} title={`Edit job ${job.name}`} />
        )}
      </Stack>
    )
  }

  return job.schedule_date ? (
    formatDate(job.schedule_date)
  ) : (
    <Stack gap="2" direction="horizontal">
      <Badge variant="warning">No schedule date</Badge>
      {details && (
        <Icon color="jn-global-text" icon="edit" href={`jobs/${job.id}/edit`} title={`Schedule job ${job.name}`} />
      )}
    </Stack>
  )
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
