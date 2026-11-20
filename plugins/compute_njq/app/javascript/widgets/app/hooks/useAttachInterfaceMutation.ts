import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface AttachInterfaceVars {
  id: string
  network_id: string
  subnet_id?: string
  ip_address?: string
  security_groups?: string[]
}
interface Ctx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component (mirrors useAttachFloatingIpMutation).
export function buildAttachInterfaceMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, AttachInterfaceVars, Ctx> {
  return {
    mutationFn: ({ id, network_id, subnet_id, ip_address, security_groups }) =>
      api.instances.attachInterface(id, { network_id, subnet_id, ip_address, security_groups }),
    onMutate: async ({ id }) => {
      // Mark the row as transitioning so it reads as attaching and the actions
      // menu locks; onSettled reconciles against the real state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) =>
          i.id === id ? { ...i, status: { ...i.status, transition: "attaching_interface" } } : i
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

export function useAttachInterfaceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildAttachInterfaceMutationOptions(api, queryClient))
}
