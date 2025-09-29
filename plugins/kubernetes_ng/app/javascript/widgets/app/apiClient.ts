import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"
import { Cluster } from "./types/clusters"
import { defaultCluster, errorCluster, unknownStatusCluster } from "./mocks/data"

const baseURL = widgetBasePath("kubernetes_ng")
const apiClient = createAjaxHelper({ baseURL })

const shootApi = {
  getClusters: () =>
    apiClient.get<{ data: Cluster[] }>("/kubernetes-ng/api/clusters/").then((response) => response.data),

  getClusterByName: (name: string) =>
    apiClient.get<{ data: Cluster }>(`/kubernetes-ng/api/clusters/${name}/`).then((response) => response.data),
}

const permissionsApi = {
  getPermissions: () =>
    apiClient
      .get<{ data: Record<string, boolean> | undefined }>("/kubernetes-ng/api/permissions/shoots/")
      .then((response) => response.data),
}

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

export const gardenerApi = {
  gardener: { ...shootApi, ...permissionsApi },
}

export type GardenerApi = typeof gardenerApi
