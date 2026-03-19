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
    refetchInterval: (data, query) => {
      if (!data) return false

      // Stop polling if there have been errors
      if (query.state.error) return false

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
 * Query hook for fetching a single cluster by name with automatic polling
 * Polls every 30 seconds when the cluster has incomplete operations (progress < 100)
 */
export function useClusterQuery(apiClient: GardenerApi | undefined, clusterName: string) {
  return useQuery<Cluster, Error>({
    queryKey: QUERY_KEYS.cluster(clusterName),
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getClusterByName(clusterName)
    },
    enabled: !!apiClient && !!clusterName,
    // Automatically refetch based on cluster operation status
    refetchInterval: (data, query) => {
      if (!data) return false

      // Stop polling if there have been errors
      if (query.state.error) return false

      // Check if this cluster has incomplete operations
      const hasIncompleteOperation = data.lastOperation && data.lastOperation.progress < 100

      // Poll every 30 seconds if there are incomplete operations, otherwise don't poll
      return hasIncompleteOperation ? 30000 : false
    },
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

/**
 * Query hook for fetching kubeconfig permissions
 * Permissions are static for the session and only change on page reload
 */
export function useKubeconfigPermissionsQuery(apiClient: GardenerApi | undefined) {
  return useQuery<Permissions, Error>({
    queryKey: QUERY_KEYS.kubeconfigPermissions,
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getKubeconfigPermission()
    },
    enabled: !!apiClient,
    staleTime: Infinity, // kubeconfig don't change during the session
    cacheTime: Infinity, // Keep in cache indefinitely until page reload
    refetchOnWindowFocus: false,
  })
}
