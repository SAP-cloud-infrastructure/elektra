import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"
import { Cluster, ClusterSchema, ClustersSchema } from "./types/cluster"
import { Permissions, PermissionsSchema } from "./types/permissions"
import { defaultCluster, errorCluster, unknownStatusCluster } from "./mocks/data"

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
  getPermissions: () => Promise.resolve({ list: true, create: true, delete: true }),
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
  }

  const permissionsApi = {
    getPermissions: () =>
      apiClient.get<{ data: Permissions }>("/api/permissions/shoots/").then((res) => {
        const parsed = PermissionsSchema.safeParse(res.data)
        if (!parsed.success) {
          throw new Error("Failed to fetch permissions: invalid response")
        }
        return res.data
      }),
  }

  return {
    gardener: { ...shootApi, ...permissionsApi },
  }
}

export type GardenerApi = ReturnType<typeof createGardenerApi>
