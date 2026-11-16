import { useMutation, QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { CreateInstancePayload } from "../types/createInstance"

export function useCreateInstanceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation({
    mutationFn: (payload: CreateInstancePayload) => api.instances.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
  })
}
