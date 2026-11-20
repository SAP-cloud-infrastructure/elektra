import { z } from "zod"

export const AvailableFloatingIpSchema = z.object({
  id: z.string(),
  floating_ip_address: z.string(),
})

export const ExternalNetworkSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
})

export const FloatingIpOptionsSchema = z.object({
  available_floating_ips: z.array(AvailableFloatingIpSchema),
  external_networks: z.array(ExternalNetworkSchema),
})

export type AvailableFloatingIp = z.infer<typeof AvailableFloatingIpSchema>
export type ExternalNetwork = z.infer<typeof ExternalNetworkSchema>
export type FloatingIpOptions = z.infer<typeof FloatingIpOptionsSchema>
