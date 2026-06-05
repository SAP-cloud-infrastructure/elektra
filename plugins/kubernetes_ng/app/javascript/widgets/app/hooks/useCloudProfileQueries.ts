import { useQuery } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { CloudProfile } from "../types/cloudProfiles"
import { DEFAULT_CLOUD_PROFILE_NAME } from "../routes/clusters/-components/ClusterWizard/constants"

/**
 * Query hook for fetching cloud profiles
 * Returns sorted list of cloud profiles
 */
export function useCloudProfilesQuery(apiClient: GardenerApi, enabled = true) {
  return useQuery<CloudProfile[], Error>({
    queryKey: QUERY_KEYS.cloudProfiles,
    queryFn: () => apiClient.gardener.getCloudProfiles(),
    enabled: enabled,
    select: (profiles) => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  })
}

/**
 * Query hook for getting cloud profile data for a specific profile and region
 * Returns machine types, images, and zones
 * Defaults to DEFAULT_CLOUD_PROFILE_NAME if cloudProfileName is not provided
 */
export function useCloudProfileData(
  apiClient: GardenerApi,
  cloudProfileName?: string,
  region?: string,
  enabled = true
) {
  const cloudProfiles = useCloudProfilesQuery(apiClient, enabled)

  // Use DEFAULT_CLOUD_PROFILE_NAME if no cloudProfileName is provided
  const profileName = cloudProfileName || DEFAULT_CLOUD_PROFILE_NAME
  const selectedCloudProfile = cloudProfiles.data?.find((profile) => profile.name === profileName)
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
