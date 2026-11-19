import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface UpdateNameVars {
  id: string
  name: string
}
interface UpdateNameCtx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component (mirrors useInstanceActionMutation).
export function buildUpdateNameMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, UpdateNameVars, UpdateNameCtx> {
  return {
    mutationFn: ({ id, name }) => api.instances.updateName(id, name),
    onMutate: async ({ id, name }) => {
      // Optimistically rename the list row so the change shows immediately;
      // onSettled reconciles against the real Nova state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, name } : i))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEYS.instances, ctx.previous)
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instanceDetail(vars.id) })
    },
  }
}

export function useUpdateInstanceNameMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildUpdateNameMutationOptions(api, queryClient))
}
