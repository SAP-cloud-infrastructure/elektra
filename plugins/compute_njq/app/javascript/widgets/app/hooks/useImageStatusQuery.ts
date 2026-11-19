import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { ImageStatus } from "../types/image"

// Glance image statuses that end the snapshot: active is success; the rest are
// failures. Anything else (queued/saving/…) means still building → keep polling.
const TERMINAL = new Set(["active", "killed", "deleted", "error"])

export function isTerminalStatus(status: string | undefined): boolean {
  return status != null && TERMINAL.has(status)
}

// Polls a Glance image's status while a snapshot is being built. Enabled only
// while the modal is in its "creating" state; stops polling itself once the
// status reaches a terminal value so a finished (or failed) snapshot does not
// keep hitting the BFF.
export function useImageStatusQuery(apiClient: ComputeApi, imageId: string | null, opts: { enabled: boolean }) {
  return useQuery<ImageStatus, Error>({
    queryKey: QUERY_KEYS.imageStatus(imageId ?? "none"),
    queryFn: () => apiClient.images.getStatus(imageId as string),
    enabled: opts.enabled && !!imageId,
    refetchInterval: (data, query) => {
      if (!data || query.state.error) return false
      return isTerminalStatus(data.status) ? false : 2000
    },
    refetchOnWindowFocus: false,
  })
}
