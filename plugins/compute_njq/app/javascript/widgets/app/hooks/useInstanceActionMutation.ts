import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface ActionVars {
  id: string
  actionName: string
  // Synthetic Nova task_state shown immediately; omitted for actions with no
  // task_state (lock/unlock).
  optimisticTransition?: string
}

interface ActionCtx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component.
export function buildActionMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, ActionVars, ActionCtx> {
  return {
    mutationFn: ({ id, actionName }) => api.instances.action(id, actionName),
    onMutate: async ({ id, optimisticTransition }) => {
      if (!optimisticTransition) return {}
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, status: { ...i.status, transition: optimisticTransition } } : i))
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

export function useInstanceActionMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildActionMutationOptions(api, queryClient))
}
