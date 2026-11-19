import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

export interface ResetStatusVars {
  id: string
  state: string
}

// Reset Status has no optimistic patch — the forced vm_state is reconciled by
// the invalidation refetch in onSettled. Factory split out for direct unit test.
export function buildResetStatusMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, ResetStatusVars> {
  return {
    mutationFn: ({ id, state }) => api.instances.resetStatus(id, state),
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instanceDetail(vars.id) })
    },
  }
}

export function useResetInstanceStatusMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildResetStatusMutationOptions(api, queryClient))
}
