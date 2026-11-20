import { useMutation, useQueryClient, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface SnapshotVars {
  id: string
  name: string
}

interface SnapshotCtx {
  previous?: Instance[]
}

// Create Snapshot behaves like the other lifecycle actions: it fires and the
// modal closes, and progress shows in the instance row's status pill. During a
// Nova snapshot the server stays ACTIVE but task_state cycles through
// image_snapshot → image_pending_upload → image_uploading, which the BFF passes
// through as status.transition — so the pill spins and the list auto-polls.
// We optimistically set the first task_state so the pill reacts immediately, and
// invalidate the list/detail on settle so the real task_state takes over.
export function buildCreateSnapshotMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<{ image_id: string | null }, Error, SnapshotVars, SnapshotCtx> {
  return {
    mutationFn: ({ id, name }) => api.instances.createSnapshot(id, name),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) =>
          i.id === id ? { ...i, status: { ...i.status, transition: "image_snapshot" } } : i
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

export function useCreateSnapshotMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildCreateSnapshotMutationOptions(api, queryClient))
}
