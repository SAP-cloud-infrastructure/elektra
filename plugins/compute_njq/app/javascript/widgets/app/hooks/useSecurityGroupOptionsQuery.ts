import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

const SHARED = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const

// Edit-security-groups modal options: all security groups visible to the
// project. Reuses the shared security_groups query key (and its cache) that the
// create form and attach-interface picker already populate.
export function useSecurityGroupOptionsQuery(api: ComputeApi) {
  return useQuery({
    queryKey: QUERY_KEYS.securityGroups,
    queryFn: () => api.formOptions.getSecurityGroups(),
    ...SHARED,
  })
}
