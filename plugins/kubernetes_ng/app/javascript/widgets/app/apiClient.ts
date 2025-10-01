import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"
import { Cluster } from "./types/clusters"
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
    getClusters: () => apiClient.get<{ data: Cluster[] }>("/api/clusters/").then((res) => res.data),

    getClusterByName: (name: string) =>
      apiClient.get<{ data: Cluster }>(`/api/clusters/${name}/`).then((res) => res.data),
  }

  const permissionsApi = {
    getPermissions: () =>
      apiClient.get<{ data: Record<string, boolean> | undefined }>("/api/permissions/shoots/").then((res) => res.data),
  }

  return {
    gardener: { ...shootApi, ...permissionsApi },
  }
}

export type GardenerApi = ReturnType<typeof createGardenerApi>
