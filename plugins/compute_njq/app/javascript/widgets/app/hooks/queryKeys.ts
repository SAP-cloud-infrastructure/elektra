/**
 * Query key constants for TanStack Query.
 * Centralized so queries and invalidations stay in sync.
 */
export const QUERY_KEYS = {
  instances: ["instances"] as const,
  instance: (id: string) => ["instance", id] as const,
  instanceDetail: (id: string) => ["instance", id, "detail"] as const,
  instanceMetrics: (id: string) => ["instance", id, "metrics"] as const,
} as const
