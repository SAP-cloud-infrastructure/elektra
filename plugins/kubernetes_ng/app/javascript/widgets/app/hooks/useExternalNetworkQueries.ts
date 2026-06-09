import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { ExternalNetwork } from "../types/network"

/**
 * Query hook for fetching external networks
 * Returns list of available external networks for cluster creation
 */
export function useExternalNetworksQuery(apiClient: GardenerApi, enabled = true) {
  return useQuery<ExternalNetwork[], Error>({
    queryKey: QUERY_KEYS.externalNetworks,
    queryFn: () => apiClient.gardener.getExternalNetworks(),
    enabled: enabled,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  })
}
