import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { ExternalNetwork } from "../types/network"

/**
 * Query hook for fetching external networks
 * Returns list of available external networks for cluster creation
 */
export function useExternalNetworksQuery(apiClient: GardenerApi | undefined, enabled = true) {
  return useQuery<ExternalNetwork[], Error>({
    queryKey: QUERY_KEYS.externalNetworks,
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getExternalNetworks()
    },
    enabled: !!apiClient && enabled,
    staleTime: 0,
    cacheTime: 0,
  })
}
