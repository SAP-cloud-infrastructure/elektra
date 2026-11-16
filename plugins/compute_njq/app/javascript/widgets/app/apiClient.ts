import { createAjaxHelper } from "lib/ajax_helper"
import { Instance, InstancesResponseSchema, InstanceResponseSchema } from "./types/instance"
import {
  FlavorsResponseSchema,
  ImagesResponseSchema,
  KeypairsResponseSchema,
  NetworksResponseSchema,
  SecurityGroupsResponseSchema,
  AvailabilityZonesResponseSchema,
} from "./types/formOptions"
import { CreateInstancePayload } from "./types/createInstance"

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

// Drops undefined/empty values so they are not serialised as query params.
function cleanParams(opts: Record<string, unknown>): Record<string, string> {
  return Object.entries(opts).reduce(
    (acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== "") acc[k] = String(v)
      return acc
    },
    {} as Record<string, string>
  )
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

    create: (payload: CreateInstancePayload): Promise<Instance> =>
      apiClient.post<{ data: { instance: Instance } }>("instances", { instance: payload }).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(InstanceResponseSchema, res.data, "instance").instance
      }),
  }

  const formOptionsApi = {
    getFlavors: () =>
      apiClient.get<{ data: unknown }>("form_options/flavors").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(FlavorsResponseSchema, res.data, "flavors").flavors
      }),
    getImages: (opts: { q?: string; marker?: string; limit?: number } = {}) =>
      apiClient.get<{ data: unknown }>("form_options/images", { params: cleanParams(opts) }).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(ImagesResponseSchema, res.data, "images")
      }),
    getKeypairs: () =>
      apiClient.get<{ data: unknown }>("form_options/keypairs").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(KeypairsResponseSchema, res.data, "keypairs").keypairs
      }),
    getNetworks: () =>
      apiClient.get<{ data: unknown }>("form_options/networks").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(NetworksResponseSchema, res.data, "networks").networks
      }),
    getSecurityGroups: () =>
      apiClient.get<{ data: unknown }>("form_options/security_groups").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(SecurityGroupsResponseSchema, res.data, "security_groups").security_groups
      }),
    getAvailabilityZones: () =>
      apiClient.get<{ data: unknown }>("form_options/availability_zones").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(AvailabilityZonesResponseSchema, res.data, "availability_zones").availability_zones
      }),
  }

  return { instances: instanceApi, formOptions: formOptionsApi }
}

export type ComputeApi = ReturnType<typeof createComputeApi>
