import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface ResizeVars {
  id: string
  flavorId: string
}
interface ResizeCtx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component (mirrors useUpdateInstanceNameMutation).
export function buildResizeMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, ResizeVars, ResizeCtx> {
  return {
    mutationFn: ({ id, flavorId }) => api.instances.resizeInstance(id, flavorId),
    onMutate: async ({ id }) => {
      // Mark the row as transitioning so it immediately reads as resizing and
      // the actions menu locks; onSettled reconciles against the real state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, status: { ...i.status, transition: "resize_prep" } } : i))
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

export function useResizeInstanceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildResizeMutationOptions(api, queryClient))
}
