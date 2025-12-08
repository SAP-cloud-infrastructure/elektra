import { ClusterFormData, WorkerGroup } from "./types"

export const DEFAULT_WORKER_GROUP: WorkerGroup = {
  name: "",
  id: "",
  machineType: "",
  machineImage: {
    name: "",
    version: "",
  },
  minimum: 1,
  maximum: 1,
  zones: [],
}

export const DEFAULT_CLUSTER_FORM_DATA: ClusterFormData = {
  name: "",
  cloudProfileName: "",
  kubernetesVersion: "",
  infrastructure: {
    floatingPoolName: "",
    apiVersion: "",
  },
  workers: [
    {
      ...DEFAULT_WORKER_GROUP,
      name: "worker1",
      id: `worker-${Date.now()}`,
    },
  ],
}
