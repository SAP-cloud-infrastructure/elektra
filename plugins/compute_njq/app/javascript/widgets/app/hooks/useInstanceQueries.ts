import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance, InstanceDetail, InstanceMetrics, isTransitioning } from "../types/instance"

// Polls while any instance is mid-transition (Nova task_state set, or still
// building), so the UI reflects spawning/rebooting/deleting/... without a
// manual refresh.
function hasPendingTransition(instances: Instance[]): boolean {
  return instances.some((i) => isTransitioning(i.status))
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

// Builds a partial InstanceDetail from the (already cached) list row, so the
// Show modal can render the shared fields (name, status, availability zone,
// IPs, image, flavor) instantly while the full detail is still loading. The
// fields the list does not carry stay empty/placeholder until the detail
// arrives.
function detailPlaceholderFromList(instance: Instance): InstanceDetail {
  return {
    id: instance.id,
    name: instance.name,
    status: instance.status,
    fault_message: null,
    availability_zone: instance.availability_zone ?? null,
    created: instance.created,
    updated: null,
    host: null,
    project: { id: null, name: null, same_scope: true },
    tags: [],
    specs:
      instance.flavor.id || instance.flavor.name
        ? { flavor: instance.flavor.name, ram: null, vcpus: null, root_disk_size: null, root_disk_device: null }
        : null,
    ip_addresses: [],
    security_groups: [],
    key_name: null,
    metadata: { image_name: instance.image.name, image_id: instance.image.id, extra: [] },
    volumes: [],
  }
}

// Full instance detail for the Show modal. Polls while the server is
// mid-transition (Nova task_state set), mirroring the legacy 10s auto-update.
// Uses the cached list row as placeholder data so the modal renders instantly
// (isPlaceholderData is true until the real aggregated detail arrives).
export function useInstanceDetailQuery(apiClient: ComputeApi, id: string) {
  const queryClient = useQueryClient()

  return useQuery<InstanceDetail, Error>({
    queryKey: QUERY_KEYS.instanceDetail(id),
    queryFn: () => apiClient.instances.getInstanceDetail(id),
    enabled: !!id,
    placeholderData: () => {
      const list = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      const row = list?.find((i) => i.id === id)
      return row ? detailPlaceholderFromList(row) : undefined
    },
    refetchInterval: (data, query) => {
      if (!data || query.state.error) return false
      return isTransitioning(data.status) ? 10000 : false
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

// vROps / Thanos metrics (sizing + guest tools). Fetched once per open; these
// are external best-effort reads, so failure is surfaced per-row, not fatal.
export function useInstanceMetricsQuery(apiClient: ComputeApi, id: string) {
  return useQuery<InstanceMetrics, Error>({
    queryKey: QUERY_KEYS.instanceMetrics(id),
    queryFn: () => apiClient.instances.getInstanceMetrics(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  })
}
