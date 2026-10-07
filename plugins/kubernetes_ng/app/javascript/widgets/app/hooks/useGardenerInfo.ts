import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

/**
 * Query hook for fetching Gardener info (version, etc.)
 * This is static for the session and doesn't change
 * @param apiClient - The API client to use for fetching
 */
export function useGardenerInfoQuery(apiClient?: GardenerApi) {
  return useQuery<{ version?: string } | null, Error>({
    queryKey: QUERY_KEYS.gardenerInfo,
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getGardenerInfo()
    },
    staleTime: Infinity, // Gardener version doesn't change during the session
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
