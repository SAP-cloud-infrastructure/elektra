import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface ActionVars {
  id: string
  actionName: string
  // Synthetic Nova task_state shown immediately for power actions. Lock/unlock
  // have no task_state, so they omit this and instead get an optimistic `locked`
  // flip (see onMutate) — no transition, so the status pill never spins and the
  // actions menu is not hidden for an instantaneous operation.
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
    onMutate: async ({ id, actionName, optimisticTransition }) => {
      // Optimistic patch: power actions show their synthetic transition; lock/
      // unlock flip `locked` (no transition, by design). onSettled reconciles.
      const patch = (i: Instance): Instance => {
        if (optimisticTransition) return { ...i, status: { ...i.status, transition: optimisticTransition } }
        if (actionName === "lock") return { ...i, locked: true }
        if (actionName === "unlock") return { ...i, locked: false }
        return i
      }
      if (!optimisticTransition && actionName !== "lock" && actionName !== "unlock") return {}
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? patch(i) : i))
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
