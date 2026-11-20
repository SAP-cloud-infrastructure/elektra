import { z } from "zod"

export const InterfaceNetworkSchema = z.object({ id: z.string(), name: z.string().nullable() })
export const InterfaceSubnetSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  cidr: z.string().nullable(),
  network_id: z.string(),
})
export const InterfaceSecurityGroupSchema = z.object({
  id: z.string(),
  // Neutron security groups always have a name (the BFF's form_security_groups
  // maps sg["name"] straight through), so grouping by name is safe.
  name: z.string(),
  project_id: z.string().nullable(),
  project_label: z.string().nullable(),
})
export const InterfaceOptionsSchema = z.object({
  networks: z.array(InterfaceNetworkSchema),
  subnets: z.array(InterfaceSubnetSchema),
  security_groups: z.array(InterfaceSecurityGroupSchema),
})
export const AttachedInterfaceSchema = z.object({
  port_id: z.string(),
  fixed_ip_address: z.string(),
  mac_addr: z.string().nullable(),
})
export const AttachedInterfacesSchema = z.object({
  attached_interfaces: z.array(AttachedInterfaceSchema),
})

export type InterfaceNetwork = z.infer<typeof InterfaceNetworkSchema>
export type InterfaceSubnet = z.infer<typeof InterfaceSubnetSchema>
export type InterfaceSecurityGroup = z.infer<typeof InterfaceSecurityGroupSchema>
export type InterfaceOptions = z.infer<typeof InterfaceOptionsSchema>
export type AttachedInterface = z.infer<typeof AttachedInterfaceSchema>
export type AttachedInterfaces = z.infer<typeof AttachedInterfacesSchema>
