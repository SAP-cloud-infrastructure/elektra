import { createAjaxHelper } from "lib/ajax_helper"
import {
  Instance,
  InstanceDetail,
  InstanceMetrics,
  InstancesResponseSchema,
  InstanceResponseSchema,
  InstanceDetailResponseSchema,
  InstanceMetricsResponseSchema,
} from "./types/instance"

// The BFF can answer with HTTP 200 but an error-shaped body when an upstream
// proxy (e.g. oauth2-proxy) rewrites the status. Detect the { error, code }
// envelope that base_controller#handle_api_call emits and turn it into a real
// thrown error so TanStack Query treats it as a failure.
function checkForApiError(data: unknown): void {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    "code" in data &&
    typeof (data as { code: unknown }).code === "number"
  ) {
    const errorData = data as { error: string; code: number; message?: string }
    const message = errorData.message || errorData.error || "API Error"
    const error = new Error(`${message} (HTTP ${errorData.code})`) as Error & { data: unknown; status: number }
    error.data = data
    error.status = errorData.code
    throw error
  }
}

// Runtime-validates a parsed body against a Zod schema, throwing a descriptive
// error (with the Zod issues attached) when the BFF contract drifts.
function parseOrThrow<T>(
  schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: unknown } },
  data: unknown,
  context: string
): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const error = new Error(`Invalid response: ${context}`) as Error & { details?: unknown }
    error.details = (parsed.error as { issues?: unknown })?.issues
    throw error
  }
  return parsed.data as T
}

// basepath already includes domain/project scope (e.g. /acme/demo/compute-njq);
// "/api/" is where base_controller mounts the BFF endpoints.
export function createComputeApi(basepath: string) {
  const apiClient = createAjaxHelper({ baseURL: basepath + "/api/" })

  const instanceApi = {
    getInstances: (): Promise<Instance[]> =>
      apiClient.get<{ data: { instances: Instance[] } }>("instances").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(InstancesResponseSchema, res.data, "instances").instances
      }),

    getInstance: (id: string): Promise<Instance> =>
      apiClient.get<{ data: { instance: Instance } }>(`instances/${id}`).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(InstanceResponseSchema, res.data, "instance").instance
      }),

    // Full instance detail (all legacy Show tabs). The BFF returns null when
    // the server cannot be found; surface that as a thrown error so the query
    // fails cleanly rather than rendering an empty modal.
    getInstanceDetail: (id: string): Promise<InstanceDetail> =>
      apiClient.get<{ data: { instance: InstanceDetail | null } }>(`instances/${id}/detail`).then((res) => {
        checkForApiError(res.data)
        const { instance } = parseOrThrow(InstanceDetailResponseSchema, res.data, "instance detail")
        if (!instance) throw new Error("Server could not be found")
        return instance
      }),

    // vROps / Thanos sizing + guest-tools metrics, proxied through the BFF.
    getInstanceMetrics: (id: string): Promise<InstanceMetrics> =>
      apiClient.get<{ data: { metrics: InstanceMetrics } }>(`instances/${id}/metrics`).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(InstanceMetricsResponseSchema, res.data, "instance metrics").metrics
      }),
  }

  return { instances: instanceApi }
}

export type ComputeApi = ReturnType<typeof createComputeApi>
