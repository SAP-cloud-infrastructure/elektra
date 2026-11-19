import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { InstanceDetail } from "../types/instance"

export interface SetTagsVars {
  id: string
  tags: string[]
}
interface SetTagsCtx {
  previous?: InstanceDetail
}

// Tags live on InstanceDetail (not the list row), so the optimistic patch
// targets QUERY_KEYS.instanceDetail(id). Factory split out for direct unit test.
export function buildSetTagsMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, SetTagsVars, SetTagsCtx> {
  return {
    mutationFn: ({ id, tags }) => api.instances.setTags(id, tags),
    onMutate: async ({ id, tags }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instanceDetail(id) })
      const previous = queryClient.getQueryData<InstanceDetail>(QUERY_KEYS.instanceDetail(id))
      if (previous) {
        queryClient.setQueryData<InstanceDetail>(QUERY_KEYS.instanceDetail(id), { ...previous, tags })
      }
      return { previous }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEYS.instanceDetail(vars.id), ctx.previous)
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instanceDetail(vars.id) })
    },
  }
}

export function useSetInstanceTagsMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildSetTagsMutationOptions(api, queryClient))
}
