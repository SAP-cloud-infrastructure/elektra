import { z } from "zod"

export const cloudProfileSchema = z.object({
  uid: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  kubernetesVersions: z.array(z.string()),
  machineTypes: z.array(
    z.object({
      name: z.string(),
      architecture: z.string().optional(),
      cpu: z.string(),
      memory: z.string(),
    })
  ),
  machineImages: z.array(
    z.object({
      name: z.string(),
      versions: z.array(z.string()),
    })
  ),
  regions: z
    .array(
      z.object({
        name: z.string(),
        zones: z.array(z.string()).optional(),
      })
    )
    .optional(),
  volumeTypes: z.array(z.string()).optional(),
})

export const CloudProfilesSchema = z.array(cloudProfileSchema)
export type CloudProfile = z.infer<typeof cloudProfileSchema>
