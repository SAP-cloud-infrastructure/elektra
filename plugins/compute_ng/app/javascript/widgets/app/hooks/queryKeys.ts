/**
 * Query key constants for TanStack Query.
 * Centralized so queries and invalidations stay in sync.
 */
export const QUERY_KEYS = {
  instances: ["instances"] as const,
  instance: (id: string) => ["instance", id] as const,
} as const
