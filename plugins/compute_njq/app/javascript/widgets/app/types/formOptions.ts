import { z } from "zod"

export const FlavorSchema = z.object({
  id: z.string(),
  name: z.string(),
  vcpus: z.number().nullable(),
  ram: z.number().nullable(),
  disk: z.number().nullable(),
  hypervisor_type: z.string().nullable(),
  is_public: z.boolean(),
})

export const ImageSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  visibility: z.string().nullable(),
  hypervisor_type: z.string().nullable(),
  img_hv_type: z.string().nullable(),
  image_type: z.string().nullable(),
  disk_format: z.string().nullable(),
  buildnumber: z.string().nullable(),
  min_disk: z.number().nullable(),
  size: z.number().nullable(),
})

export const KeypairSchema = z.object({ name: z.string() })
export const NetworkSchema = z.object({ id: z.string(), name: z.string().nullable() })
export const SecurityGroupSchema = z.object({ id: z.string(), name: z.string() })
export const AvailabilityZoneSchema = z.object({ name: z.string() })

export const FlavorsResponseSchema = z.object({ flavors: z.array(FlavorSchema) })
export const ImagesResponseSchema = z.object({ images: z.array(ImageSchema) })
export const KeypairsResponseSchema = z.object({ keypairs: z.array(KeypairSchema) })
export const NetworksResponseSchema = z.object({ networks: z.array(NetworkSchema) })
export const SecurityGroupsResponseSchema = z.object({ security_groups: z.array(SecurityGroupSchema) })
export const AvailabilityZonesResponseSchema = z.object({
  availability_zones: z.array(AvailabilityZoneSchema),
})

export type Flavor = z.infer<typeof FlavorSchema>
export type Image = z.infer<typeof ImageSchema>
export type Keypair = z.infer<typeof KeypairSchema>
export type Network = z.infer<typeof NetworkSchema>
export type SecurityGroup = z.infer<typeof SecurityGroupSchema>
export type AvailabilityZone = z.infer<typeof AvailabilityZoneSchema>
