import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Cluster } from "../types/cluster"
import { Permissions } from "../types/permissions"
import { ClusterFormData, ClusterUpdateData } from "../routes/clusters/-components/ClusterWizard/types"

/**
 * Query hook for fetching clusters with automatic polling
 * Polls every 30 seconds when any cluster has incomplete operations (progress < 100)
 */
export function useClustersQuery(apiClient: GardenerApi) {
  return useQuery<Cluster[], Error>({
    queryKey: QUERY_KEYS.clusters,
    queryFn: () => apiClient.gardener.getClusters(),
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
export function useClusterQuery(apiClient: GardenerApi, clusterName: string) {
  return useQuery<Cluster, Error>({
    queryKey: QUERY_KEYS.cluster(clusterName),
    queryFn: () => apiClient.gardener.getClusterByName(clusterName),
    enabled: !!clusterName,
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
export function useShootPermissionsQuery(apiClient: GardenerApi) {
  return useQuery<Permissions, Error>({
    queryKey: QUERY_KEYS.permissions,
    queryFn: () => apiClient.gardener.getShootPermissions(),
    staleTime: Infinity, // Permissions don't change during the session
    cacheTime: Infinity, // Keep in cache indefinitely until page reload (v4 name, renamed to gcTime in v5)
    refetchOnWindowFocus: false,
  })
}

/**
 * Query hook for fetching kubeconfig permissions
 * Permissions are static for the session and only change on page reload
 */
export function useKubeconfigPermissionsQuery(apiClient: GardenerApi) {
  return useQuery<Permissions, Error>({
    queryKey: QUERY_KEYS.kubeconfigPermissions,
    queryFn: () => apiClient.gardener.getKubeconfigPermission(),
    staleTime: Infinity, // kubeconfig don't change during the session
    cacheTime: Infinity, // Keep in cache indefinitely until page reload
    refetchOnWindowFocus: false,
  })
}

/**
 * Mutation hook for updating a cluster
 * Automatically invalidates the cluster query on success
 */
export function useUpdateClusterMutation(apiClient: GardenerApi) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clusterName, data }: { clusterName: string; data: ClusterUpdateData }) => {
      return apiClient.gardener.updateCluster(clusterName, data)
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific cluster query to refetch latest data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cluster(variables.clusterName) })
      // Also invalidate clusters list to keep it in sync
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clusters })
    },
  })
}

/**
 * Mutation hook for creating a cluster
 * Automatically invalidates the clusters list on success
 */
export function useCreateClusterMutation(apiClient: GardenerApi) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clusterData: ClusterFormData) => {
      return apiClient.gardener.createCluster(clusterData)
    },
    onSuccess: () => {
      // Invalidate clusters list to show the new cluster
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clusters })
    },
  })
}

/**
 * Mutation hook for reconciling a cluster
 * Adds the gardener.cloud/operation=reconcile annotation to trigger reconciliation
 */
export function useReconcileClusterMutation(apiClient: GardenerApi) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clusterName }: { clusterName: string }) => {
      return apiClient.gardener.updateCluster(clusterName, {
        metadata: {
          annotations: {
            "gardener.cloud/operation": "reconcile",
          },
        },
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific cluster query to refetch latest data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cluster(variables.clusterName) })
      // Also invalidate clusters list to keep it in sync
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clusters })
    },
  })
}
