import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

// Live fetch — staleTime 0 so the detach modal always reads current interfaces.
// Gated by the `enabled` flag: pass true only while the modal is open.
export function useAttachedInterfacesQuery(api: ComputeApi, id: string, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.attachedInterfaces(id),
    queryFn: () => api.instances.getAttachedInterfaces(id),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}
