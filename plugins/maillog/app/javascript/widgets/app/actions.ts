import { FormatRequestData } from "./helper"

export class HTTPError extends Error {
  public readonly statusCode: number
  public readonly isNetworkError: boolean

  constructor(code: number, message: string, isNetworkError = false) {
    super(message || String(code))
    this.name = "HTTPError"
    this.statusCode = code
    this.isNetworkError = isNetworkError
  }
}

export class NetworkError extends Error {
  public readonly isNetworkError = true

  constructor(message: string) {
    super(message)
    this.name = "NetworkError"
  }
}

export interface MailSearchOptions {
  from?: string
  subject?: string
  rcpt?: string[]
  id?: string
  messageId?: string
  headerFrom?: string
  relay?: string
  project?: string
  pageSize?: number
  page?: number
  start?: Date | null
  end?: Date | null
}

export interface MailSearchResponse {
  data: MailLogEntry[]
  hits: number
}

export interface MailLogEntry {
  id: string
  [key: string]: unknown
}

export interface QueryKeyParams {
  queryKey: [string, string, string, MailSearchOptions]
}

export const encodeUrlParamsFromObject = (options: Record<string, unknown>): string => {
  if (!options) return ""
  const encodedOptions = Object.keys(options)
    .map((k) => {
      if (typeof options[k] === "object" && options[k] !== null && !Array.isArray(options[k])) {
        const childOption = options[k] as Record<string, unknown>
        return Object.keys(childOption).map(
          (childKey) => `${encodeURIComponent(childKey)}=${encodeURIComponent(String(childOption[childKey]))}`
        )
      }
      return `${encodeURIComponent(k)}=${encodeURIComponent(String(options[k]))}`
    })
    .join("&")
  return `&${encodedOptions}`
}

const checkStatus = (response: Response): Promise<Response> => {
  if (response.status < 400) {
    return Promise.resolve(response)
  } else {
    return response.text().then((message) => {
      const error = new HTTPError(response.status, message || response.statusText)
      return Promise.reject(error)
    })
  }
}

//
// SERVICES
//

export const dataFn = ({ queryKey }: QueryKeyParams): Promise<MailSearchResponse> => {
  const [_key, bearerToken, endpoint, options] = queryKey
  const requestData = FormatRequestData(options)
  return fetchFromAPI(bearerToken, endpoint, "/v1/mails/search", requestData)
}

//
// COMMONS
//

const fetchFromAPI = async (
  bearerToken: string,
  endpoint: string,
  path: string,
  queryParams: string
): Promise<MailSearchResponse> => {
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
      const jsonResponse = (await response.json()) as MailSearchResponse
      return jsonResponse
    } else {
      // If the response status is not in the 2xx range, throw an error with proper categorization
      let errorMessage = ""
      let errorDetails: { message?: string; error?: string } | null = null

      try {
        errorDetails = await response.json()
        errorMessage = errorDetails?.message || errorDetails?.error || response.statusText
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
    if (error instanceof Error && error.name === "AbortError") {
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Unexpected error during fetch:", url, errorMessage)
    throw new NetworkError(`An unexpected error occurred: ${errorMessage}`)
  }
}
