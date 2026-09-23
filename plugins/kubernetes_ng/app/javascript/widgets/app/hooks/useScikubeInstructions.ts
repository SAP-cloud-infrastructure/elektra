import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

/**
 * Query hook for fetching scikube getting started instructions
 * Fetches the README.md content from the scikube-getting-started-markdown ConfigMap
 * Cached for the entire session - instructions rarely change
 */
export function useScikubeInstructions(apiClient: GardenerApi | undefined, enabled = true) {
  return useQuery<string, Error>({
    queryKey: QUERY_KEYS.scikubeInstructions,
    queryFn: async () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getScikubeInstructions()
    },
    enabled: enabled && !!apiClient,
    staleTime: Infinity, // Never consider stale - cache for entire session
    cacheTime: Infinity, // Keep in cache forever during session
    refetchOnWindowFocus: false,
  })
}
