import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

/**
 * Query hook for fetching scikube getting started instructions
 * Fetches the README.md content from the scikube-getting-started-markdown ConfigMap
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
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  })
}
