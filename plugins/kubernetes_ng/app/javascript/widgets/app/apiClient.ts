import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"
import { Cluster, ClusterSchema, ClustersSchema } from "./types/cluster"
import { Permissions, PermissionsSchema } from "./types/permissions"
import { CloudProfile, CloudProfilesSchema } from "./types/cloudProfiles"
import { defaultCluster, errorCluster, unknownStatusCluster } from "./mocks/data"
import { ClusterFormData } from "./routes/clusters/-components/ClusterWizard/types"
import { ExternalNetwork, ExternalNetworksSchema } from "./types/network"

export const gardenerTestApi = {
  getClusters: () => Promise.resolve([defaultCluster, errorCluster, unknownStatusCluster]),
  getClusterByName: (name: string) => {
    const clusters = [defaultCluster, errorCluster, unknownStatusCluster]
    const cluster = clusters.find((c) => c.name === name)
    if (cluster) {
      return Promise.resolve(cluster)
    } else {
      return Promise.reject(new Error("Cluster not found"))
    }
  },
  getShootPermissions: () => Promise.resolve({ list: true, get: true, create: true, update: true, delete: true }),
  getKubeconfigPermission: () => Promise.resolve({ list: true, get: true, create: true, update: true, delete: true }),
}

export function createGardenerApi(mountpoint: string) {
  const baseURL = widgetBasePath(mountpoint)
  const apiClient = createAjaxHelper({ baseURL })

  const shootApi = {
    getClusters: () =>
      apiClient.get<{ data: Cluster[] }>("/api/clusters/").then((res) => {
        const parsed = ClustersSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch clusters: invalid response")
        }
        return res.data
      }),

    getClusterByName: (name: string) =>
      apiClient.get<{ data: Cluster }>(`/api/clusters/${name}/`).then((res) => {
        const parsed = ClusterSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch cluster: invalid response")
        }
        return res.data
      }),

    createCluster: (clusterData: ClusterFormData) =>
      apiClient.post<{ data: Cluster }>("/api/clusters/", clusterData).then((res) => {
        const parsed = ClusterSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to create cluster: invalid response")
        }
        return res.data
      }),

    getKubeconfig: (name: string) =>
      apiClient.get<{ data: string }>(`/api/clusters/kubeconfig/${name}/`).then((res) => {
        return res.data
      }),
  }

  const permissionsApi = {
    getShootPermissions: () =>
      apiClient.get<{ data: Permissions }>("/api/permissions/shoots/").then((res) => {
        const parsed = PermissionsSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch permissions: invalid response")
        }
        return res.data
      }),
    getKubeconfigPermission: () =>
      apiClient.get<{ data: Permissions }>("/api/permissions/clusters_admin_kubeconfig/").then((res) => {
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
        const parsed = ExternalNetworksSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch external networks: invalid response")
        }
        return res.data
      }),
  }

  const CloudProfilesApi = {
    getCloudProfiles: () =>
      apiClient.get<{ data: CloudProfile[] }>("/api/cloud-profiles").then((res) => {
        const parsed = CloudProfilesSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch cloud profiles: invalid response")
        }
        return res.data
      }),
  }

  return {
    gardener: { ...shootApi, ...permissionsApi, ...CloudProfilesApi, ...networkApi },
  }
}

export type GardenerApi = ReturnType<typeof createGardenerApi>
