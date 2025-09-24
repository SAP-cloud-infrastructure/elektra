import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"
import { Cluster } from "./types/clusters"

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

export const gardenerApi = {
  gardener: { ...shootApi, ...permissionsApi },
}

export type GardenerApi = typeof gardenerApi
