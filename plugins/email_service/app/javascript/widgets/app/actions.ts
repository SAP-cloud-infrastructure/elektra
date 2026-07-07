import { FormatRequestData } from "./helper"

// API request timeout in milliseconds
const API_TIMEOUT_MS = 30000

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
  tag?: string[]
  pageSize?: number
  page?: number
  start?: Date | null
  end?: Date | null
  [key: string]: unknown
}

export interface MailSearchResponse {
  data: MailLogEntry[]
  hits: number
}

export interface Recipient {
  rcpt: string
  relay: string
  response?: {
    code?: string
    ext?: string
    msg?: string
  }
}

export interface Attempt {
  date: string
  hostname: string
  dialog: {
    mailFrom?: {
      response?: {
        code?: string
        msg?: string
      }
    }
    data?: {
      response?: {
        code?: string
        msg?: string
      }
    }
  }
}

export interface MailLogEntry {
  id: string
  date: string
  from: string
  headerFrom: string
  subject: string
  messageId: string
  rcpts: Recipient[]
  attempts?: Attempt[]
  summary: Record<string, number>
  response?: { code?: number; ext?: string; msg?: string }
  [key: string]: unknown
}

export interface QueryKeyParams {
  queryKey: [string, string, string, MailSearchOptions]
}

export interface ReportSearchOptions {
  start?: Date | null
  end?: Date | null
  mta?: string
  project?: string
  rankingSize?: number
}

export interface Counters {
  emails: number
  recipients: number
  bounces: number
  success: number
  errors: number
  tempErrs: number
  permErrs: number
  others: number
}

export interface ResponseSet {
  counters: Counters
  byResponse: Record<string, number>
}

export interface RelayResponseMap {
  counters: Counters
  byPhase: Record<string, ResponseSet>
  byHostname: Record<string, ResponseSet>
  byUsername: Record<string, ResponseSet>
  bySender: Record<string, ResponseSet>
  byRecipient: Record<string, ResponseSet>
  data: ResponseSet
}

export interface Report {
  start: string
  end: string
  mta: string
  projectId: string
  projectName: string
  totals: RelayResponseMap
  byProjectId: Record<string, Counters>
  incoming: RelayResponseMap
  configErrs: number
  outgoing: RelayResponseMap
  byRelay: Record<string, RelayResponseMap>
}

export interface RankingEntry {
  name: string
  total: number
  share: number
}

export interface Ranking {
  name: string
  key: string
  total: number
  entries: RankingEntry[]
}

export interface RankingList {
  byProjectId?: Ranking
  byPhase?: Ranking
  byRelay?: Ranking
  byHostname?: Ranking
  bySender?: Ranking
  byRecipient?: Ranking
  byDataError?: Ranking
}

export interface ReportSearchResponse {
  error?: string
  message?: string
  hits: number
  reports: number
  data?: Report
  rankings?: RankingList
  errorTags?: boolean
}

export interface ReportQueryKeyParams {
  queryKey: [string, string, string, ReportSearchOptions]
}

// ─── Cronus API types ────────────────────────────────────────────────────────

export interface CronusApiResponse<T = unknown> {
  data?: T
  error?: string
  errorDetails?: unknown
  message?: string
}

export interface HeaderDomain {
  domain: string
  object: string
}

export interface HeaderDomainsListResponse {
  data: HeaderDomain[]
  next_token?: string
}

export interface CronusReceiptRule {
  maildrop: string[]
}

export type RecipientMap = Record<string, CronusReceiptRule>

export interface AddRecipientPayload {
  localpart: string
  maildrop: string[]
}

export interface Rfc6902Patch {
  op: "add" | "remove"
  path: string
  value?: CronusReceiptRule
}

export interface ComplianceRule {
  technicalSenderDomain: string
  legalEntityName: string
  countryCode: string
  enabled?: boolean
  logStorageDays?: number
  logVisibilityDays?: number
}

export interface ComplianceRuleWithDefault {
  technicalSenderDomain: string
  effectiveCountryCode: string
  domainRule?: ComplianceRule
  defaultRule?: ComplianceRule
}

export interface ComplianceResponse {
  rules: ComplianceRule[]
}

export interface UpsertComplianceRuleRequest {
  technicalSenderDomain: string
  legalEntityName?: string
  countryCode: string
}

export interface DkimResponse {
  domain: string
  selector: string
  object: string
  project: string
  enabled: boolean
  dkim_record_p: string
  verification_status: string
}

export interface PostDkimRequest {
  selector: string
  private_key: string
  enabled: boolean
  rollover: boolean
}

export interface PutDkimRequest {
  enabled: boolean
  private_key?: string
}

export interface WhoamiResponse {
  projectId: string
  projectName: string
  domainId: string
  domainName: string
  userId: string
  userName: string
  enabled: boolean
  enabledProviders: string[]
  receivingEnabled: boolean
  ownerEmails: string[]
  roles: string[]
}

export interface ReceivingResponse {
  enabled: boolean
  notificationQueue?: string
  storageContainerName?: string
  storageDomainName?: string
  storageFormat?: string
  storageProjectName?: string
  storageType?: string
}

export interface UpsertReceivingConfigurationRequest {
  enabled: boolean
  storageContainerName: string
  storageType?: string
  storageFormat?: string
  storageDomainName?: string
  storageProjectName?: string
  notificationQueue?: string
}

// ─────────────────────────────────────────────────────────────────────────────

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

//
// SERVICES
//

export const dataFn = ({ queryKey }: QueryKeyParams): Promise<MailSearchResponse> => {
  const [_key, bearerToken, endpoint, options] = queryKey
  const requestData = FormatRequestData(options)
  return fetchFromAPI<MailSearchResponse>(bearerToken, endpoint, "/v1/mails/search", requestData)
}

export const reportDataFn = ({ queryKey }: ReportQueryKeyParams): Promise<ReportSearchResponse> => {
  const [_key, bearerToken, endpoint, options] = queryKey
  const requestData = FormatRequestData(options as Record<string, unknown>)
  return fetchFromAPI<ReportSearchResponse>(bearerToken, endpoint, "/v1/report", requestData)
}

//
// COMMONS
//

const fetchFromAPI = async <T>(
  bearerToken: string,
  endpoint: string,
  path: string,
  queryParams: string
): Promise<T> => {
  const url = `${endpoint}${path}?${queryParams}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": bearerToken,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Check if the request was successful (status code 2xx)
    if (response.ok) {
      const jsonResponse = (await response.json()) as T
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
      throw networkError
    }

    // Re-throw HTTPError and NetworkError as-is
    if (error instanceof HTTPError || error instanceof NetworkError) {
      throw error
    }

    // Handle any other unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new NetworkError(`An unexpected error occurred: ${errorMessage}`)
  }
}

// ─── Cronus API (proxied through Rails) ──────────────────────────────────────

const cronusFetch = async <T>(
  bearerToken: string,
  cronusEndpoint: string,
  path: string,
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT",
  body?: unknown
): Promise<T> => {
  const url = `${cronusEndpoint.replace(/\/$/, "")}/cronus-proxy${path}`
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": bearerToken,
      },
      signal: controller.signal,
    }
    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }
    const response = await fetch(url, init)
    clearTimeout(timeoutId)

    if (response.status === 204) {
      return undefined as unknown as T
    }

    if (response.ok) {
      return (await response.json()) as T
    }

    let errorMessage = ""
    try {
      const errorDetails = (await response.json()) as { message?: string; error?: string }
      errorMessage = errorDetails?.message || errorDetails?.error || response.statusText
    } catch {
      try {
        errorMessage = await response.text()
      } catch {
        errorMessage = response.statusText
      }
    }

    if (response.status >= 500) {
      throw new HTTPError(response.status, `Service temporarily unavailable (${response.status}). ${errorMessage || "Please try again later."}`)
    } else if (response.status === 404) {
      throw new HTTPError(response.status, `Not found (404). ${errorMessage || ""}`)
    } else if (response.status === 403) {
      throw new HTTPError(response.status, `Access forbidden (403). ${errorMessage || ""}`)
    } else if (response.status === 401) {
      throw new HTTPError(response.status, `Authentication failed (401). ${errorMessage || "Please refresh the page to re-authenticate."}`)
    } else if (response.status === 422) {
      throw new HTTPError(response.status, `Validation error (422). ${errorMessage || ""}`)
    } else {
      throw new HTTPError(response.status, `Request failed (${response.status}). ${errorMessage || ""}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timeout. The API is taking too long to respond.")
    }
    if (error instanceof TypeError) {
      throw new NetworkError("Network error. Unable to connect to the Cronus API.")
    }
    if (error instanceof HTTPError || error instanceof NetworkError) throw error
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new NetworkError(`An unexpected error occurred: ${errorMessage}`)
  }
}

// Header Domains

export const fetchHeaderDomains = (
  bearerToken: string,
  cronusEndpoint: string,
  size?: number,
  nextToken?: string
): Promise<HeaderDomainsListResponse> => {
  const params = new URLSearchParams()
  if (size !== undefined) params.set("size", String(size))
  if (nextToken) params.set("nextToken", nextToken)
  const qs = params.toString() ? `?${params.toString()}` : ""
  return cronusFetch<HeaderDomainsListResponse>(bearerToken, cronusEndpoint, `/v1/header-domains${qs}`, "GET")
}

// Recipients

export const fetchRecipients = (
  bearerToken: string,
  cronusEndpoint: string,
  domainId: string
): Promise<RecipientMap> =>
  cronusFetch<RecipientMap>(bearerToken, cronusEndpoint, `/v1/header-domains/${encodeURIComponent(domainId)}/recipients`, "GET")

export const createRecipient = (
  bearerToken: string,
  cronusEndpoint: string,
  domainId: string,
  payload: AddRecipientPayload
): Promise<AddRecipientPayload> =>
  cronusFetch<AddRecipientPayload>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(domainId)}/recipients`,
    "POST",
    payload
  )

export const deleteRecipient = (
  bearerToken: string,
  cronusEndpoint: string,
  domainId: string,
  localpart: string
): Promise<void> =>
  cronusFetch<void>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(domainId)}/recipients/${encodeURIComponent(localpart)}`,
    "DELETE"
  )

export const patchRecipients = (
  bearerToken: string,
  cronusEndpoint: string,
  domainId: string,
  patches: Rfc6902Patch[]
): Promise<void> =>
  cronusFetch<void>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(domainId)}/recipients`,
    "PATCH",
    patches
  )

// Compliance

export const fetchCompliance = (
  bearerToken: string,
  cronusEndpoint: string
): Promise<CronusApiResponse<ComplianceResponse>> =>
  cronusFetch<CronusApiResponse<ComplianceResponse>>(bearerToken, cronusEndpoint, "/v1/compliance", "GET")

export const fetchComplianceRule = (
  bearerToken: string,
  cronusEndpoint: string,
  domain: string
): Promise<CronusApiResponse<ComplianceRuleWithDefault>> =>
  cronusFetch<CronusApiResponse<ComplianceRuleWithDefault>>(
    bearerToken,
    cronusEndpoint,
    `/v1/compliance/rule/${encodeURIComponent(domain)}`,
    "GET"
  )

export const upsertComplianceRule = (
  bearerToken: string,
  cronusEndpoint: string,
  rule: UpsertComplianceRuleRequest
): Promise<CronusApiResponse> =>
  cronusFetch<CronusApiResponse>(bearerToken, cronusEndpoint, "/v1/compliance/rule", "POST", rule)

export const deleteComplianceRule = (
  bearerToken: string,
  cronusEndpoint: string,
  domain: string
): Promise<CronusApiResponse> =>
  cronusFetch<CronusApiResponse>(
    bearerToken,
    cronusEndpoint,
    `/v1/compliance/rule/${encodeURIComponent(domain)}`,
    "DELETE"
  )

// Receiving Configuration

export const fetchReceivingConfig = (
  bearerToken: string,
  cronusEndpoint: string
): Promise<CronusApiResponse<ReceivingResponse>> =>
  cronusFetch<CronusApiResponse<ReceivingResponse>>(bearerToken, cronusEndpoint, "/v1/receiving", "GET")

export const upsertReceivingConfig = (
  bearerToken: string,
  cronusEndpoint: string,
  config: UpsertReceivingConfigurationRequest
): Promise<CronusApiResponse> =>
  cronusFetch<CronusApiResponse>(bearerToken, cronusEndpoint, "/v1/receiving", "POST", config)

export const deleteReceivingConfig = (
  bearerToken: string,
  cronusEndpoint: string
): Promise<CronusApiResponse> =>
  cronusFetch<CronusApiResponse>(bearerToken, cronusEndpoint, "/v1/receiving", "DELETE")

// DKIM

export const fetchDkim = (
  bearerToken: string,
  cronusEndpoint: string,
  headerDomain: string
): Promise<CronusApiResponse<DkimResponse[]>> =>
  cronusFetch<CronusApiResponse<DkimResponse[]>>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(headerDomain)}/dkim`,
    "GET"
  )

export const fetchDkimSelector = (
  bearerToken: string,
  cronusEndpoint: string,
  headerDomain: string,
  selector: string
): Promise<CronusApiResponse<DkimResponse>> =>
  cronusFetch<CronusApiResponse<DkimResponse>>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(headerDomain)}/dkim/${encodeURIComponent(selector)}`,
    "GET"
  )

export const createDkim = (
  bearerToken: string,
  cronusEndpoint: string,
  headerDomain: string,
  payload: PostDkimRequest
): Promise<CronusApiResponse<DkimResponse>> =>
  cronusFetch<CronusApiResponse<DkimResponse>>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(headerDomain)}/dkim`,
    "POST",
    payload
  )

export const updateDkim = (
  bearerToken: string,
  cronusEndpoint: string,
  headerDomain: string,
  selector: string,
  payload: PutDkimRequest
): Promise<CronusApiResponse<DkimResponse>> =>
  cronusFetch<CronusApiResponse<DkimResponse>>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(headerDomain)}/dkim/${encodeURIComponent(selector)}`,
    "PUT",
    payload
  )

export const deleteDkim = (
  bearerToken: string,
  cronusEndpoint: string,
  headerDomain: string,
  selector: string
): Promise<CronusApiResponse> =>
  cronusFetch<CronusApiResponse>(
    bearerToken,
    cronusEndpoint,
    `/v1/header-domains/${encodeURIComponent(headerDomain)}/dkim/${encodeURIComponent(selector)}`,
    "DELETE"
  )

// Whoami

export const fetchWhoami = (
  bearerToken: string,
  cronusEndpoint: string
): Promise<WhoamiResponse> =>
  cronusFetch<WhoamiResponse>(bearerToken, cronusEndpoint, "/v1/whoami", "GET")
