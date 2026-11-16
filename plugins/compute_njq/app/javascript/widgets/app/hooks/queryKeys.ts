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
  securityGroups: ["form", "security_groups"] as const,
  availabilityZones: ["form", "availability_zones"] as const,
  images: ["form", "images"] as const,
} as const
