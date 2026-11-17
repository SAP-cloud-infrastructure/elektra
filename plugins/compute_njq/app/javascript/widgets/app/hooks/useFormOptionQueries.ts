import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

const SHARED = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const

export function useFlavorsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.flavors, queryFn: () => api.formOptions.getFlavors(), enabled, ...SHARED })
}
export function useKeypairsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.keypairs, queryFn: () => api.formOptions.getKeypairs(), enabled, ...SHARED })
}
export function useNetworksQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.networks, queryFn: () => api.formOptions.getNetworks(), enabled, ...SHARED })
}
export function useSubnetsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.subnets, queryFn: () => api.formOptions.getSubnets(), enabled, ...SHARED })
}
export function useSecurityGroupsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.securityGroups,
    queryFn: () => api.formOptions.getSecurityGroups(),
    enabled,
    ...SHARED,
  })
}
export function useAvailabilityZonesQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.availabilityZones,
    queryFn: () => api.formOptions.getAvailabilityZones(),
    enabled,
    ...SHARED,
  })
}
export function useImagesQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.images, queryFn: () => api.formOptions.getImages(), enabled, ...SHARED })
}
export function useVolumeTypesQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.volumeTypes,
    queryFn: () => api.formOptions.getVolumeTypes(),
    enabled,
    ...SHARED,
  })
}
