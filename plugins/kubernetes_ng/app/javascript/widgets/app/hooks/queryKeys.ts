/**
 * Query key constants for TanStack Query
 * Centralized to ensure consistency across queries and invalidations
 */
export const QUERY_KEYS = {
  clusters: ["clusters"] as const,
  cluster: (name: string) => ["cluster", name] as const,
  permissions: ["shoot-permissions"] as const,
  kubeconfigPermissions: ["kubeconfig-permissions"] as const,
} as const
