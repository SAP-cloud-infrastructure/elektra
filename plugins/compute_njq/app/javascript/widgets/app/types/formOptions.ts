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
  // Used as the secondary sort key within a visibility group (name, then
  // created), and nullable because Glance may omit it.
  created: z.string().nullable(),
  // Owner project id + resolved "<domain>/<project>" label, shown as a suffix on
  // private images (mirrors the legacy ". Project: <name>" label).
  owner: z.string().nullable(),
  owner_label: z.string().nullable(),
})

export const KeypairSchema = z.object({ name: z.string() })
export const NetworkSchema = z.object({ id: z.string(), name: z.string().nullable() })
export const SecurityGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  // The owning project; used to group SGs (the list includes shared SGs from
  // other projects). project_label is a resolved "<domain>/<project>" name,
  // falling back to the raw project id when the project is not cached.
  project_id: z.string().nullable(),
  project_label: z.string().nullable(),
})
export const AvailabilityZoneSchema = z.object({ name: z.string() })
export const VolumeTypeSchema = z.object({ id: z.string(), name: z.string() })

export const FlavorsResponseSchema = z.object({ flavors: z.array(FlavorSchema) })
export const ImagesResponseSchema = z.object({ images: z.array(ImageSchema) })
export const KeypairsResponseSchema = z.object({ keypairs: z.array(KeypairSchema) })
export const NetworksResponseSchema = z.object({ networks: z.array(NetworkSchema) })
export const SecurityGroupsResponseSchema = z.object({ security_groups: z.array(SecurityGroupSchema) })
export const AvailabilityZonesResponseSchema = z.object({
  availability_zones: z.array(AvailabilityZoneSchema),
})
export const VolumeTypesResponseSchema = z.object({ volume_types: z.array(VolumeTypeSchema) })

export type Flavor = z.infer<typeof FlavorSchema>
export type Image = z.infer<typeof ImageSchema>
export type Keypair = z.infer<typeof KeypairSchema>
export type Network = z.infer<typeof NetworkSchema>
export type SecurityGroup = z.infer<typeof SecurityGroupSchema>
export type AvailabilityZone = z.infer<typeof AvailabilityZoneSchema>
export type VolumeType = z.infer<typeof VolumeTypeSchema>
