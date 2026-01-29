export const parseError = (error) => {
  let errMsg = error

  // check if error is JSON containing message or just string
  if (typeof error === "string") {
    errMsg = parseMessage(error)
  }

  // check if the error is a object containing message
  if (typeof error === "object") {
    console.log("Error parsing error message::object")
    if (error?.message) {
      errMsg = parseMessage(error?.message)
    }
  }
  return errMsg
}

export const FormatRequestData = (options) => {
  // Filter out null and empty values from requestData, but handle arrays properly
  const filteredRequestData = Object.entries(options).reduce(
    (acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = value.toISOString().split(".")[0]
      }
      else
        if (Array.isArray(value)) {
        // If the value is an array, add each element separately
        value.forEach((item) => {
          if (item !== null && item !== "") {
            acc[key + "[]"] = acc[key + "[]"] || []
            acc[key + "[]"].push(item)
          }
        })
      } else if (value !== null && value !== "") {
        acc[key] = value
      }
      return acc
    },
    {}
  )
  // Convert the filtered requestData to query parameters
  const queryParams = new URLSearchParams()

  // Iterate over the filtered data to append to queryParams
  Object.entries(filteredRequestData).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => queryParams.append(key, item))
    } else {
      queryParams.append(key, value)
    }
  })

  return queryParams.toString()
}
const parseMessage = (message) => {
  let newMsg = message
  try {
    newMsg = JSON.parse(message)
    if (newMsg?.message) {
      newMsg = (newMsg?.code ? `${newMsg.code}, ` : "") + newMsg?.message
    }
  } catch (error) {}

  return newMsg
}
