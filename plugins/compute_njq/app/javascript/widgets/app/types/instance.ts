import { z } from "zod"

// Shapes mirror the UI-ready hashes emitted by the BFF InstanceAssembler,
// NOT the raw OpenStack payloads. They are validated at runtime (safeParse in
// apiClient) so a backend contract drift surfaces as a clear error instead of
// a downstream `undefined`.

export const InstanceStatusSchema = z.object({
  state: z.string(),
  // Nova task_state during a transition (e.g. "spawning"); null when idle.
  transition: z.string().nullable().optional(),
})

export const InstanceIpsSchema = z.object({
  fixed: z.array(z.string()),
  floating: z.array(z.string()),
})

export const InstanceRefSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
})

export const InstanceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  status: InstanceStatusSchema,
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

export type InstanceStatus = z.infer<typeof InstanceStatusSchema>
export type InstanceIps = z.infer<typeof InstanceIpsSchema>
export type Instance = z.infer<typeof InstanceSchema>
