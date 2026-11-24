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
import {
  FlavorsResponseSchema,
  ImagesResponseSchema,
  KeypairsResponseSchema,
  NetworksResponseSchema,
  SubnetsResponseSchema,
  SecurityGroupsResponseSchema,
  AvailabilityZonesResponseSchema,
  VolumeTypesResponseSchema,
} from "./types/formOptions"
import { CreateInstancePayload } from "./types/createInstance"
import { ImageStatus, ImageStatusResponseSchema, SnapshotResponse, SnapshotResponseSchema } from "./types/image"
import { FloatingIpOptions, FloatingIpOptionsSchema } from "./types/floatingIp"
import { InterfaceOptionsSchema, AttachedInterfacesSchema } from "./types/interface"
import type { InterfaceOptions, AttachedInterfaces } from "./types/interface"
import { Console, ConsoleResponseSchema } from "./types/console"

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

// On a non-2xx response the ajax helper throws an Error whose `.message` is only
// the envelope's generic `error` field ("API Error") — the real backend detail
// lives in `error.data.message`. Re-throw with that detail so the UI shows the
// actual reason (e.g. the Nova quota/validation message) instead of "API Error".
function detailedError(err: unknown): Error {
  const e = err as { data?: { error?: string; code?: number; message?: string }; status?: number; message?: string }
  const envelope = e?.data
  if (envelope && (envelope.message || envelope.error)) {
    const code = envelope.code ?? e.status
    const text = envelope.message || envelope.error
    const detailed = new Error(code ? `${text} (HTTP ${code})` : String(text)) as Error & {
      data?: unknown
      status?: number
    }
    detailed.data = envelope
    detailed.status = code
    return detailed
  }
  return err instanceof Error ? err : new Error(String(err))
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
      apiClient
        .post<{ data: { instance: Instance } }>("instances", { instance: payload })
        .then((res) => {
          checkForApiError(res.data)
          return parseOrThrow(InstanceResponseSchema, res.data, "instance").instance
        })
        .catch((err) => {
          throw detailedError(err)
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

    // Fresh Nova remote-console URL. The token is short-lived, so this is
    // fetched on every open and never cached (the hook sets staleTime 0).
    getConsole: (id: string): Promise<Console> =>
      apiClient.get<{ data: { console: unknown } }>(`instances/${id}/console`).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(ConsoleResponseSchema, res.data, "console").console
      }),

    // Generic lifecycle action (start/stop/reboot/lock/...). The BFF answers
    // { ok: true }; we only need success/failure, so there is nothing to parse.
    action: (id: string, actionName: string): Promise<void> =>
      apiClient.post<{ data: { ok: true } }>(`instances/${id}/action`, { action_name: actionName }).then((res) => {
        checkForApiError(res.data)
      }),

    terminate: (id: string): Promise<void> =>
      apiClient.delete<{ data: { ok: true } }>(`instances/${id}`).then((res) => {
        checkForApiError(res.data)
      }),

    // Edit Name: PUT /servers/{id} via the BFF; body mirrors create ({ instance }).
    // The BFF answers { ok: true } — nothing to parse, just surface failures.
    updateName: (id: string, name: string): Promise<void> =>
      apiClient.put<{ data: { ok: true } }>(`instances/${id}`, { instance: { name } }).then((res) => {
        checkForApiError(res.data)
      }),

    // Edit Tags: replace the full tag set. An empty list clears all tags.
    setTags: (id: string, tags: string[]): Promise<void> =>
      apiClient.put<{ data: { ok: true } }>(`instances/${id}/tags`, { tags }).then((res) => {
        checkForApiError(res.data)
      }),

    // Reset Status: admin-only vm_state recovery (active|error).
    resetStatus: (id: string, state: string): Promise<void> =>
      apiClient.post<{ data: { ok: true } }>(`instances/${id}/reset_status`, { state }).then((res) => {
        checkForApiError(res.data)
      }),

    // Resize: change the server's flavor via the BFF. The BFF answers { ok: true }.
    resizeInstance: (id: string, flavorId: string): Promise<void> =>
      apiClient.put<{ data: { ok: true } }>(`instances/${id}/resize`, { flavor_id: flavorId }).then((res) => {
        checkForApiError(res.data)
      }),

    // Attach a floating IP: either an existing free FIP (floating_ip_id) or a new
    // one allocated on an external network (floating_network_id). The BFF answers
    // { ok: true }; nothing to parse, just surface failures.
    attachFloatingIp: (
      id: string,
      body: { floating_ip_id?: string; floating_network_id?: string; fixed_ip_address: string }
    ): Promise<void> =>
      apiClient
        .post<{ data: { ok: true } }>(`instances/${id}/attach_floating_ip`, body)
        .then((res) => {
          checkForApiError(res.data)
        })
        .catch((err) => {
          throw detailedError(err)
        }),

    // Detach a floating IP by address; the BFF resolves the FIP id server-side.
    detachFloatingIp: (id: string, body: { floating_ip_address: string }): Promise<void> =>
      apiClient
        .post<{ data: { ok: true } }>(`instances/${id}/detach_floating_ip`, body)
        .then((res) => {
          checkForApiError(res.data)
        })
        .catch((err) => {
          throw detailedError(err)
        }),

    // Attach a network interface to an instance. Optionally specify a subnet,
    // fixed IP address, or security groups. The BFF answers { ok: true }.
    attachInterface: (
      id: string,
      body: { network_id: string; subnet_id?: string; ip_address?: string; security_groups?: string[] }
    ): Promise<void> =>
      apiClient
        .post<{ data: { ok: true } }>(`instances/${id}/attach_interface`, body)
        .then((res) => {
          checkForApiError(res.data)
        })
        .catch((err) => {
          throw detailedError(err)
        }),

    // Detach a network interface identified by its fixed IP address.
    detachInterface: (id: string, body: { fixed_ip_address: string }): Promise<void> =>
      apiClient
        .post<{ data: { ok: true } }>(`instances/${id}/detach_interface`, body)
        .then((res) => {
          checkForApiError(res.data)
        })
        .catch((err) => {
          throw detailedError(err)
        }),

    // Replace the instance's security-group set (written to its Neutron ports).
    setSecurityGroups: (id: string, body: { security_groups: string[] }): Promise<void> =>
      apiClient
        .put<{ data: { ok: true } }>(`instances/${id}/security_groups`, body)
        .then((res) => {
          checkForApiError(res.data)
        })
        .catch((err) => {
          throw detailedError(err)
        }),

    // Returns all network interfaces currently attached to the instance.
    getAttachedInterfaces: (id: string): Promise<AttachedInterfaces> =>
      apiClient.get<{ data: unknown }>(`instances/${id}/attached_interfaces`).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(AttachedInterfacesSchema, res.data, "attached_interfaces")
      }),

    // Snapshot: create a Glance image of the server. createImage only acknowledges;
    // the BFF returns the new image id so the client can poll its status. image_id
    // may be null when neither the Location header nor the name fallback resolved it.
    createSnapshot: (id: string, name: string): Promise<SnapshotResponse> =>
      apiClient
        .post<{ data: SnapshotResponse }>(`instances/${id}/snapshot`, { snapshot: { name } })
        .then((res) => {
          checkForApiError(res.data)
          return parseOrThrow(SnapshotResponseSchema, res.data, "snapshot")
        })
        .catch((err) => {
          throw detailedError(err)
        }),
  }

  // Generic image reads (snapshot status polling), kept reusable rather than
  // coupled to the snapshot flow.
  const imagesApi = {
    getStatus: (id: string): Promise<ImageStatus> =>
      apiClient.get<{ data: { image: ImageStatus } }>(`images/${id}`).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(ImageStatusResponseSchema, res.data, "image status").image
      }),
  }

  const formOptionsApi = {
    getFlavors: () =>
      apiClient.get<{ data: unknown }>("form_options/flavors").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(FlavorsResponseSchema, res.data, "flavors").flavors
      }),
    getImages: () =>
      apiClient.get<{ data: unknown }>("form_options/images").then((res) => {
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
    getSubnets: () =>
      apiClient.get<{ data: unknown }>("form_options/subnets").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(SubnetsResponseSchema, res.data, "subnets")
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
    getVolumeTypes: () =>
      apiClient.get<{ data: unknown }>("form_options/volume_types").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(VolumeTypesResponseSchema, res.data, "volume_types").volume_types
      }),
    getFloatingIpOptions: (): Promise<FloatingIpOptions> =>
      apiClient.get<{ data: unknown }>("form_options/floating_ip_options").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(FloatingIpOptionsSchema, res.data, "floating_ip_options")
      }),

    getInterfaceOptions: (): Promise<InterfaceOptions> =>
      apiClient.get<{ data: unknown }>("form_options/interface_options").then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(InterfaceOptionsSchema, res.data, "interface_options")
      }),
  }

  return { instances: instanceApi, formOptions: formOptionsApi, images: imagesApi }
}

export type ComputeApi = ReturnType<typeof createComputeApi>
