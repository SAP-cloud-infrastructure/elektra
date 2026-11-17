import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface TerminateVars {
  id: string
}
interface TerminateCtx {
  previous?: Instance[]
}

export function buildTerminateMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, TerminateVars, TerminateCtx> {
  return {
    mutationFn: ({ id }) => api.instances.terminate(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, status: { ...i.status, transition: "deleting" } } : i))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEYS.instances, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
  }
}

export function useTerminateInstanceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildTerminateMutationOptions(api, queryClient))
}
