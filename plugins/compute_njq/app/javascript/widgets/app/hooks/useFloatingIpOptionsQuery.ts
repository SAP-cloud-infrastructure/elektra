import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

const SHARED = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const

// Attach-FIP modal data: free floating IPs to pick from + external networks to
// allocate a new FIP from. Fetched fresh when the modal opens (the set of free
// FIPs changes as other users attach/detach), hence the modest staleTime.
export function useFloatingIpOptionsQuery(api: ComputeApi) {
  return useQuery({
    queryKey: QUERY_KEYS.floatingIpOptions,
    queryFn: () => api.formOptions.getFloatingIpOptions(),
    ...SHARED,
  })
}
