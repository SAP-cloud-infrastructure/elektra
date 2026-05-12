import { z } from "zod"

const machineTypeSchema = z.object({
  name: z.string(),
  architecture: z.string().optional(),
  cpu: z.string(),
  memory: z.string(),
})

const machineImageSchema = z.object({
  name: z.string(),
  versions: z.array(z.string()),
})

export const cloudProfileSchema = z.object({
  uid: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  providerConfig: z.object({
    apiVersion: z.string(),
  }),
  kubernetesVersions: z.array(z.string()),
  machineTypes: z.array(machineTypeSchema),
  machineImages: z.array(machineImageSchema),
  regions: z
    .array(
      z.object({
        name: z.string(),
        zones: z.array(z.string()).optional(),
      })
    )
    .optional(),
})

export const CloudProfilesSchema = z.array(cloudProfileSchema)
export type CloudProfile = z.infer<typeof cloudProfileSchema>
export type MachineType = z.infer<typeof machineTypeSchema>
export type MachineImage = z.infer<typeof machineImageSchema>
