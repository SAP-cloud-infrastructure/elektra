import { z } from "zod"

export const ExternalNetworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  availability_zones: z.array(z.string()),
  status: z.string(),
})
export const ExternalNetworksSchema = z.array(ExternalNetworkSchema)

export type ExternalNetwork = z.infer<typeof ExternalNetworkSchema>
