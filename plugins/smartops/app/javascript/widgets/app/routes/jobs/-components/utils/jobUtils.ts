// utils/jobUtils.ts
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

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
