import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

// Polls while any instance is mid-transition (Nova task_state set), so the UI
// reflects spawning/rebooting/deleting without a manual refresh.
function hasPendingTransition(instances: Instance[]): boolean {
  return instances.some((i) => !!i.status.transition)
}

export function useInstancesQuery(apiClient: ComputeApi) {
  return useQuery<Instance[], Error>({
    queryKey: QUERY_KEYS.instances,
    queryFn: () => apiClient.instances.getInstances(),
    refetchInterval: (data, query) => {
      if (!data || query.state.error) return false
      return hasPendingTransition(data) ? 15000 : false
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useInstanceQuery(apiClient: ComputeApi, id: string) {
  return useQuery<Instance, Error>({
    queryKey: QUERY_KEYS.instance(id),
    queryFn: () => apiClient.instances.getInstance(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
