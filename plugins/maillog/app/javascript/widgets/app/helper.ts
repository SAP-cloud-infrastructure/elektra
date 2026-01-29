export const parseError = (error: unknown): string => {
  let errMsg: string = String(error)

  // check if error is JSON containing message or just string
  if (typeof error === "string") {
    errMsg = parseMessage(error)
  }

  // check if the error is a object containing message
  if (typeof error === "object" && error !== null) {
    console.log("Error parsing error message::object")
    if ("message" in error && typeof error.message === "string") {
      errMsg = parseMessage(error.message)
    }
  }
  return errMsg
}

export const FormatRequestData = (options: Record<string, unknown>): string => {
  // Filter out null and empty values from requestData, but handle arrays properly
  const filteredRequestData: Record<string, string | string[]> = Object.entries(options).reduce(
    (acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = value.toISOString().split(".")[0]
      } else if (Array.isArray(value)) {
        // If the value is an array, add each element separately
        value.forEach((item) => {
          if (item !== null && item !== "") {
            if (!acc[key + "[]"]) {
              acc[key + "[]"] = []
            }
            ;(acc[key + "[]"] as string[]).push(String(item))
          }
        })
      } else if (value !== null && value !== "") {
        acc[key] = String(value)
      }
      return acc
    },
    {} as Record<string, string | string[]>
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

const parseMessage = (message: string): string => {
  let newMsg: string = message
  try {
    const parsed = JSON.parse(message) as { code?: string; message?: string }
    if (parsed?.message) {
      newMsg = (parsed?.code ? `${parsed.code}, ` : "") + parsed?.message
    }
  } catch (error) {
    // If parsing fails, return the original message
  }

  return newMsg
}
