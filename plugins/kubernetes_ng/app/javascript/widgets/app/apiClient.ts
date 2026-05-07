import { createAjaxHelper } from "lib/ajax_helper"
import { Cluster, ClusterSchema, ClustersSchema } from "./types/cluster"
import { Permissions, PermissionsSchema } from "./types/permissions"
import { CloudProfile, CloudProfilesSchema } from "./types/cloudProfiles"
import { ClusterFormData, ClusterUpdateData } from "./routes/clusters/-components/ClusterWizard/types"
import { ExternalNetwork, ExternalNetworksSchema } from "./types/network"

// Helper to check if response data contains an API error (even with 200 status due to oauth2-proxy middleware)
function checkForApiError(data: unknown): void {
  if (data && typeof data === "object" && "error" in data && "code" in data && typeof (data as { code: unknown }).code === "number") {
    const errorData = data as { error: string; code: number; message?: string }
    const errorMessage = errorData.message || errorData.error || "API Error"
    const error = new Error(`${errorMessage} (HTTP ${errorData.code})`) as Error & { data: unknown; status: number }
    error.data = data
    error.status = errorData.code
    throw error
  }
}

export function createGardenerApi(basepath: string) {
  // Use basepath directly - it already includes the landscape (e.g., /kubernetes-gardener/prod)
  const apiClient = createAjaxHelper({ baseURL: basepath })

  const shootApi = {
    getClusters: () =>
      apiClient.get<{ data: Cluster[] }>("/api/clusters/").then((res) => {
        checkForApiError(res.data)
        const parsed = ClustersSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch clusters: invalid response")
        }
        return res.data
      }),
    getClusterByName: (name: string) =>
      apiClient.get<{ data: Cluster }>(`/api/clusters/${name}/`).then((res) => {
        checkForApiError(res.data)
        const parsed = ClusterSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch cluster: invalid response")
        }
        return res.data
      }),
    createCluster: (clusterData: ClusterFormData) =>
      apiClient.post<{ data: Cluster }>("/api/clusters/", clusterData).then((res) => {
        checkForApiError(res.data)
        const parsed = ClusterSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to create cluster: invalid response")
        }
        return res.data
      }),
    updateCluster: (name: string, clusterData: ClusterUpdateData) =>
      apiClient.patch<{ data: object }>(`/api/clusters/${name}/`, clusterData).then((res) => {
        checkForApiError(res.data)
        return res.data
      }),
    replaceCluster: (name: string, rawResource: object) =>
      apiClient.put<{ data: Cluster }>(`/api/clusters/${name}/replace/`, rawResource).then((res) => {
        checkForApiError(res.data)
        const parsed = ClusterSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to replace cluster: invalid response")
        }
        return res.data
      }),
    getClusterKubeconfig: (name: string) =>
      apiClient
        .get<{ data: string }>(`/api/clusters/kubeconfig/${name}/`)
        .then((res) => {
          checkForApiError(res.data)
          return res.data
        })
        .catch((err: unknown) => {
          // Handle serialized server errors so normalizeError can pick up the proper message
          if (err && typeof err === "object" && "data" in err) {
            const data = (err as { data?: Record<string, unknown> }).data
            if (data?.message && typeof data.message === "string") {
              throw err // serialized server error
            }
          }

          // Fallback to normal Error
          throw new Error(err instanceof Error ? err.message : "Failed to fetch clusterkubeconfig")
        }),
    confirm_deletion_and_destroy: (name: string) =>
      apiClient.delete<{ data: Cluster }>(`/api/clusters/confirm-deletion-and-destroy/${name}/`).then((res) => {
        checkForApiError(res.data)
        const parsed = ClusterSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to delete cluster: invalid response")
        }
        return res.data
      }),
  }

  const permissionsApi = {
    getShootPermissions: () =>
      apiClient.get<{ data: Permissions }>("/api/permissions/shoots/").then((res) => {
        checkForApiError(res.data)
        const parsed = PermissionsSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch permissions: invalid response")
        }
        return res.data
      }),
    getKubeconfigPermission: () =>
      apiClient.get<{ data: Permissions }>("/api/permissions/clusters_admin_kubeconfig/").then((res) => {
        checkForApiError(res.data)
        const parsed = PermissionsSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch kubeconfig permissions: invalid response")
        }
        return res.data
      }),
  }

  const networkApi = {
    getExternalNetworks: () =>
      apiClient.get<{ data: ExternalNetwork[] }>("/api/clusters/external-networks").then((res) => {
        checkForApiError(res.data)
        const parsed = ExternalNetworksSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch external networks: invalid response")
        }
        return res.data
      }),
  }

  const cloudProfilesApi = {
    getCloudProfiles: () =>
      apiClient.get<{ data: CloudProfile[] }>("/api/cloud-profiles").then((res) => {
        checkForApiError(res.data)
        const parsed = CloudProfilesSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch cloud profiles: invalid response")
        }
        return res.data
      }),
  }

  const gardenApi = {
    getGardenerApiKubeconfig: () =>
      apiClient
        .get<{ data: string }>("/api/gardener-api/kubeconfig")
        .then((res) => {
          checkForApiError(res.data)
          return res.data
        })
        .catch((err: unknown) => {
          // Handle serialized server errors so normalizeError can pick up the proper message
          if (err && typeof err === "object" && "data" in err) {
            const data = (err as { data?: Record<string, unknown> }).data
            if (data?.message && typeof data.message === "string") {
              throw err // serialized server error
            }
          }

          // Fallback to normal Error
          throw new Error(err instanceof Error ? err.message : "Failed to fetch garden kubeconfig")
        }),
  }

  return {
    gardener: { ...shootApi, ...permissionsApi, ...cloudProfilesApi, ...networkApi, ...gardenApi },
  }
}

export type GardenerApi = ReturnType<typeof createGardenerApi>
