import { useMutation, type UseMutationOptions, type QueryClient } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

export interface EditSecurityGroupsVars {
  id: string
  security_groups: string[]
}

// Edit the instance's security groups. The write replaces the whole set on the
// instance's Neutron ports, so there is no optimistic row transition; we just
// invalidate the list and the detail so the Security Groups tab refreshes.
export function buildEditSecurityGroupsMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, EditSecurityGroupsVars> {
  return {
    mutationFn: ({ id, security_groups }) => api.instances.setSecurityGroups(id, { security_groups }),
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instanceDetail(vars.id) })
    },
  }
}

export function useEditSecurityGroupsMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildEditSecurityGroupsMutationOptions(api, queryClient))
}
