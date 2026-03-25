import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { CloudProfile } from "../types/cloudProfiles"

/**
 * Query hook for fetching cloud profiles
 * Returns sorted list of cloud profiles
 */
export function useCloudProfilesQuery(apiClient: GardenerApi | undefined, enabled = true) {
  return useQuery<CloudProfile[], Error>({
    queryKey: QUERY_KEYS.cloudProfiles,
    queryFn: () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getCloudProfiles()
    },
    enabled: !!apiClient && enabled,
    select: (profiles) => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    staleTime: 0,
    cacheTime: 0,
  })
}

/**
 * Query hook for getting cloud profile data for a specific profile and region
 * Returns machine types, images, and zones
 */
export function useCloudProfileData(
  apiClient: GardenerApi | undefined,
  cloudProfileName?: string,
  region?: string,
  enabled = true
) {
  const cloudProfiles = useCloudProfilesQuery(apiClient, enabled)

  const selectedCloudProfile = cloudProfiles.data?.find((profile) => profile.name === cloudProfileName)
  const availableMachineTypes = selectedCloudProfile?.machineTypes ?? []
  const availableMachineImages = selectedCloudProfile?.machineImages ?? []
  const availableZones = selectedCloudProfile?.regions?.find((r) => r.name === region)?.zones ?? []

  return {
    cloudProfiles,
    selectedCloudProfile,
    availableMachineTypes,
    availableMachineImages,
    availableZones,
    isLoading: cloudProfiles.isLoading,
    error: cloudProfiles.error instanceof Error ? cloudProfiles.error : null,
  }
}
