export const parseError = (error) => {
  if (!error || (typeof error === "object" && Object.keys(error).length === 0))
    return "An error occurred. There is no further information"
  let errMsg = JSON.stringify(error)
  if (error?.message) {
    errMsg = error?.message
    try {
      const msgJson = JSON.parse(error?.message)
      if (msgJson.error) errMsg = msgJson.error
      if (msgJson.msg) errMsg = msgJson.msg
    } catch (error) {}
  }
  return errMsg
}

export const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  } catch (error) {
    return "Invalid Date"
  }
}
