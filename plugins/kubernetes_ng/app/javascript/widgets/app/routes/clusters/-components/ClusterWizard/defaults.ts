import { ClusterFormData, WorkerGroup } from "./types"

// Generate random 5-character suffix (lowercase alphanumeric)
// Exported for reuse in other components
export const generateRandomSuffix = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

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

// Function to create default cluster form data with random worker name
export const createDefaultClusterFormData = (): ClusterFormData => ({
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
      name: `worker-${generateRandomSuffix()}`,
      id: `worker-${Date.now()}`,
    },
  ],
})

// For backwards compatibility, export a default instance
export const DEFAULT_CLUSTER_FORM_DATA: ClusterFormData = createDefaultClusterFormData()
