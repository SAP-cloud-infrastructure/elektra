import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Cluster } from "../types/cluster"
import { Permissions } from "../types/permissions"

/**
 * Query hook for fetching clusters with automatic polling
 * Polls every 30 seconds when any cluster has incomplete operations (progress < 100)
 */
export function useClustersQuery(apiClient: GardenerApi | undefined) {
  return useQuery<Cluster[], Error>({
    queryKey: QUERY_KEYS.clusters,
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getClusters()
    },
    enabled: !!apiClient,
    // Automatically refetch based on cluster operations status
    refetchInterval: (data) => {
      if (!data) return false

      // Check if any cluster has incomplete operations
      const hasIncompleteOperations = data.some(
        (cluster) => cluster.lastOperation && cluster.lastOperation.progress < 100
      )

      // Poll every 30 seconds if there are incomplete operations, otherwise don't poll
      return hasIncompleteOperations ? 30000 : false
    },
    // Keep data fresh but don't show stale state
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Query hook for fetching shoot permissions
 * Permissions are static for the session and only change on page reload
 */
export function useShootPermissionsQuery(apiClient: GardenerApi | undefined) {
  return useQuery<Permissions, Error>({
    queryKey: QUERY_KEYS.permissions,
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getShootPermissions()
    },
    enabled: !!apiClient,
    staleTime: Infinity, // Permissions don't change during the session
    cacheTime: Infinity, // Keep in cache indefinitely until page reload (v4 name, renamed to gcTime in v5)
    refetchOnWindowFocus: false,
  })
}
