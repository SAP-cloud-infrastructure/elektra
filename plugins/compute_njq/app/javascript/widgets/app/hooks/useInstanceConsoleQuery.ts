import { useQuery } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import type { Console } from "../types/console"
import { QUERY_KEYS } from "./queryKeys"

// Fetch a fresh Nova remote-console URL for an instance. The URL carries a
// short-lived token, so the query never serves a cached value: staleTime and
// cacheTime are 0 and it refetches on every open. `enabled` gates the fetch to
// when the console panel is actually open for this instance.
export function useInstanceConsoleQuery(api: ComputeApi, id: string, enabled: boolean) {
  return useQuery<Console, Error>({
    queryKey: QUERY_KEYS.instanceConsole(id),
    queryFn: () => api.instances.getConsole(id),
    enabled,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  })
}
