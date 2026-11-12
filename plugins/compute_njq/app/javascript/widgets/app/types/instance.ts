import { z } from "zod"

// Shapes mirror the UI-ready hashes emitted by the BFF InstanceAssembler,
// NOT the raw OpenStack payloads. They are validated at runtime (safeParse in
// apiClient) so a backend contract drift surfaces as a clear error instead of
// a downstream `undefined`.

export const InstanceStatusSchema = z.object({
  state: z.string(),
  // Nova task_state during a transition (e.g. "spawning"); null when idle.
  transition: z.string().nullable().optional(),
  // Human power-state label (e.g. "Running"); shown as the pill text while the
  // colour derives from `state`. Optional for backwards compatibility.
  power_state: z.string().nullable().optional(),
  // Nova fault message, present only when the server is in ERROR state.
  fault_message: z.string().nullable().optional(),
})

// A single IP on the server, tagged with its Nova type. Taken straight from the
// server's addresses — the overview shows these and flags floating ones; the
// precise fixed<->floating association lives in the detail view.
export const InstanceIpSchema = z.object({
  addr: z.string(),
  type: z.enum(["fixed", "floating"]),
})

export const InstanceIpsSchema = z.array(InstanceIpSchema)

export const InstanceRefSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
})

export const InstanceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  status: InstanceStatusSchema,
  availability_zone: z.string().nullable().optional(),
  flavor: InstanceRefSchema,
  image: InstanceRefSchema,
  ips: InstanceIpsSchema,
  created: z.string().nullable(),
})

export const InstancesResponseSchema = z.object({
  instances: z.array(InstanceSchema),
})

export const InstanceResponseSchema = z.object({
  instance: InstanceSchema,
})

// ---------------------------------------------------------------------------
// Instance detail (the legacy "Show" modal). Shapes mirror the UI-ready hashes
// emitted by InstanceDetailAssembler — one key group per legacy tab.
// ---------------------------------------------------------------------------

export const DetailProjectSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  same_scope: z.boolean(),
})

export const DetailSpecsSchema = z.object({
  flavor: z.string().nullable(),
  ram: z.number().nullable(),
  vcpus: z.number().nullable(),
  root_disk_size: z.number().nullable(),
  root_disk_device: z.string().nullable(),
})

export const DetailIpSchema = z.object({
  fixed: z.object({ addr: z.string(), mac: z.string().nullable() }),
  floating: z.object({ addr: z.string() }).nullable(),
})

export const DetailNetworkIpsSchema = z.object({
  network_name: z.string(),
  ips: z.array(DetailIpSchema),
})

export const DetailSecurityGroupSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  project_name: z.string().nullable(),
  rules: z.array(z.string()),
})

export const DetailMetadataEntrySchema = z.object({
  key: z.string(),
  value: z.string().nullable(),
})

export const DetailMetadataSchema = z.object({
  image_name: z.string().nullable(),
  image_id: z.string().nullable(),
  extra: z.array(DetailMetadataEntrySchema),
})

export const DetailVolumeSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  device: z.string().nullable(),
  size: z.number().nullable(),
})

export const InstanceDetailSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  status: InstanceStatusSchema,
  fault_message: z.string().nullable(),
  availability_zone: z.string().nullable(),
  created: z.string().nullable(),
  updated: z.string().nullable(),
  host: z.string().nullable(),
  project: DetailProjectSchema,
  tags: z.array(z.string()),
  specs: DetailSpecsSchema.nullable(),
  ip_addresses: z.array(DetailNetworkIpsSchema),
  security_groups: z.array(DetailSecurityGroupSchema),
  key_name: z.string().nullable(),
  metadata: DetailMetadataSchema,
  volumes: z.array(DetailVolumeSchema),
})

export const InstanceDetailResponseSchema = z.object({
  instance: InstanceDetailSchema.nullable(),
})

// Thanos / vROps metrics proxied through the BFF.
export const GuestToolsSchema = z.object({
  installed: z.string().nullable(),
  target: z.string().nullable(),
  state: z.enum(["not_found", "outdated", "up_to_date"]),
})

export const InstanceMetricsSchema = z.object({
  // Recommended vCPU count; null means current sizing is OK.
  cpu_recommendation: z.string().nullable(),
  // Recommended memory in GB; null means current sizing is OK.
  memory_recommendation: z.number().nullable(),
  // null means no powered-on guest-tools metric (legacy "not found").
  guest_tools: GuestToolsSchema.nullable(),
})

export const InstanceMetricsResponseSchema = z.object({
  metrics: InstanceMetricsSchema,
})

export type InstanceStatus = z.infer<typeof InstanceStatusSchema>
export type InstanceIps = z.infer<typeof InstanceIpsSchema>
export type InstanceIp = z.infer<typeof InstanceIpSchema>
export type Instance = z.infer<typeof InstanceSchema>
export type InstanceDetail = z.infer<typeof InstanceDetailSchema>
export type DetailNetworkIps = z.infer<typeof DetailNetworkIpsSchema>
export type DetailSecurityGroup = z.infer<typeof DetailSecurityGroupSchema>
export type DetailVolume = z.infer<typeof DetailVolumeSchema>
export type InstanceMetrics = z.infer<typeof InstanceMetricsSchema>
export type GuestTools = z.infer<typeof GuestToolsSchema>

// A server is "in transition" (something is actively happening) when Nova
// reports a task_state (spawning/rebooting/deleting/migrating/...) OR when the
// vm_state is still "building" — during a build the task_state can briefly be
// null between phases, so BUILD counts too. This drives the spinner and the
// list auto-refresh. VERIFY_RESIZE is deliberately NOT a transition: nothing is
// running, it waits for the user to confirm/revert.
export function isTransitioning(status: InstanceStatus): boolean {
  return !!status.transition || status.state === "building"
}
