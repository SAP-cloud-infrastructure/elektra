/**
 * Query key constants for TanStack Query.
 * Centralized so queries and invalidations stay in sync.
 */
export const QUERY_KEYS = {
  instances: ["instances"] as const,
  instance: (id: string) => ["instance", id] as const,
  flavors: ["form", "flavors"] as const,
  keypairs: ["form", "keypairs"] as const,
  networks: ["form", "networks"] as const,
  subnets: ["form", "subnets"] as const,
  securityGroups: ["form", "security_groups"] as const,
  availabilityZones: ["form", "availability_zones"] as const,
  volumeTypes: ["form", "volume_types"] as const,
  floatingIpOptions: ["form", "floating_ip_options"] as const,
  images: ["form", "images"] as const,
  instanceDetail: (id: string) => ["instance", id, "detail"] as const,
  instanceMetrics: (id: string) => ["instance", id, "metrics"] as const,
  imageStatus: (id: string) => ["image", id, "status"] as const,
} as const
