import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface DetachFloatingIpVars {
  id: string
  floating_ip_address: string
}
interface Ctx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component (mirrors useAttachFloatingIpMutation).
export function buildDetachFloatingIpMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, DetachFloatingIpVars, Ctx> {
  return {
    mutationFn: ({ id, floating_ip_address }) => api.instances.detachFloatingIp(id, { floating_ip_address }),
    onMutate: async ({ id }) => {
      // Mark the row as transitioning so it reads as disassociating and the
      // actions menu locks; onSettled reconciles against the real state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) =>
          i.id === id ? { ...i, status: { ...i.status, transition: "disassociating_floating_ip" } } : i
        )
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

export function useDetachFloatingIpMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildDetachFloatingIpMutationOptions(api, queryClient))
}
