import { FormatRequestData } from "./helper"

class HTTPError extends Error {
  constructor(code, message, isNetworkError = false) {
    super(message || code)
    this.name = "HTTPError"
    this.statusCode = code
    this.isNetworkError = isNetworkError
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message)
    this.name = "NetworkError"
    this.isNetworkError = true
  }
}

export const encodeUrlParamsFromObject = (options) => {
  if (!options) return ""
  let encodedOptions = Object.keys(options)
    .map((k) => {
      if (typeof options[k] === "object") {
        const childOption = options[k]
        return Object.keys(childOption).map(
          (childKey) => `${encodeURIComponent(childKey)}=${encodeURIComponent(childOption[childKey])}`
        )
      }
      return `${encodeURIComponent(k)}=${encodeURIComponent(options[k])}`
    })
    .join("&")
  return `&${encodedOptions}`
}

const checkStatus = (response) => {
  if (response.status < 400) {
    return response
  } else {
    return response.text().then((message) => {
      var error = new HTTPError(response.status, message || response.statusText)
      error.statusCode = response.status
      return Promise.reject(error)
    })
  }
}

//
// SERVICES
//

export const dataFn = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  const requestData = FormatRequestData(options)
  return fetchFromAPI(bearerToken, endpoint, "/v1/mails/search", requestData)
}

//
// COMMONS
//

const fetchFromAPI = async (bearerToken, endpoint, path, queryParams) => {
  const url = `${endpoint}${path}?${queryParams}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${bearerToken}`, // Uncomment if needed
        "X-Auth-Token": bearerToken,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Check if the request was successful (status code 2xx)
    if (response.ok) {
      const jsonResponse = await response.json()
      return jsonResponse
    } else {
      // If the response status is not in the 2xx range, throw an error with proper categorization
      let errorMessage = ""
      let errorDetails = null

      try {
        errorDetails = await response.json()
        errorMessage = errorDetails.message || errorDetails.error || response.statusText
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          errorMessage = await response.text()
        } catch (textError) {
          errorMessage = response.statusText
        }
      }

      // Categorize error based on status code
      if (response.status >= 500) {
        throw new HTTPError(
          response.status,
          `Service temporarily unavailable. The API server returned an error (${response.status}). ${errorMessage || "Please try again later."}`
        )
      } else if (response.status === 404) {
        throw new HTTPError(response.status, `API endpoint not found (404). ${errorMessage || ""}`)
      } else if (response.status === 403) {
        throw new HTTPError(
          response.status,
          `Access forbidden (403). ${errorMessage || "You may not have permission to access this resource."}`
        )
      } else if (response.status === 401) {
        throw new HTTPError(
          response.status,
          `Authentication failed (401). ${errorMessage || "Please refresh the page to re-authenticate."}`
        )
      } else if (response.status === 429) {
        throw new HTTPError(
          response.status,
          `Too many requests (429). ${errorMessage || "Please wait a moment before trying again."}`
        )
      } else {
        throw new HTTPError(response.status, `Request failed (${response.status}). ${errorMessage || ""}`)
      }
    }
  } catch (error) {
    // Handle network errors (connection issues, timeouts, CORS, etc.)
    if (error.name === "AbortError") {
      const timeoutError = new NetworkError(
        "Request timeout. The API is taking too long to respond. Please check your connection and try again."
      )
      console.error("Request timeout:", url)
      throw timeoutError
    }

    // TypeError with "Failed to fetch" typically indicates CORS or network issues
    if (error instanceof TypeError) {
      // Check if it's a CORS error
      const isCorsError =
        error.message.toLowerCase().includes("cors") ||
        error.message.toLowerCase().includes("cross-origin") ||
        error.message.toLowerCase().includes("failed to fetch")

      const networkError = new NetworkError(
        isCorsError
          ? "CORS error. Unable to connect to the mail log service. This could be due to CORS restrictions, network connectivity issues, or the service being unavailable."
          : "Network error. Unable to connect to the API. The service may be down or unreachable. Please check your connection and try again."
      )
      console.error("Network error:", url, error.message)
      throw networkError
    }

    // Re-throw HTTPError and NetworkError as-is
    if (error instanceof HTTPError || error instanceof NetworkError) {
      throw error
    }

    // Handle any other unexpected errors
    console.error("Unexpected error during fetch:", url, error.message)
    throw new NetworkError(`An unexpected error occurred: ${error.message}`)
  }
}
