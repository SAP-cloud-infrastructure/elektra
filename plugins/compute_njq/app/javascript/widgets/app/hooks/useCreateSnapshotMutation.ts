import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"

export interface SnapshotVars {
  id: string
  name: string
}

// Factory kept separate from the hook for unit testing, mirroring the resize
// mutation. No optimistic cache update: a snapshot does not change the instance
// row; the modal polls the new image's status instead.
export function buildCreateSnapshotMutationOptions(
  api: ComputeApi
): UseMutationOptions<{ image_id: string | null }, Error, SnapshotVars> {
  return {
    mutationFn: ({ id, name }) => api.instances.createSnapshot(id, name),
  }
}

export function useCreateSnapshotMutation(api: ComputeApi) {
  return useMutation(buildCreateSnapshotMutationOptions(api))
}
