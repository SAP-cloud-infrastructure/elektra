import { Cluster, Worker } from "../types/cluster"
import { Permissions } from "../types/permissions"
import { ExternalNetwork } from "../types/network"
import { CloudProfile } from "../types/cloudProfiles"

export const worker1: Worker = {
  name: "worker-a1",
  architecture: "amd64",
  machineType: "m5.large",
  machineImage: {
    name: "gardenlinux",
    version: "934.6.0",
  },
  containerRuntime: "containerd",
  min: 1,
  max: 3,
  actual: 2,
  maxSurge: 1,
  zones: ["eu-central-1a"],
}

export const worker2: Worker = {
  name: "worker-arm1",
  architecture: "arm64",
  machineType: "c7g.large",
  machineImage: {
    name: "ubuntu",
    version: "22.04",
  },
  containerRuntime: "containerd",
  min: 2,
  max: 5,
  actual: 4,
  maxSurge: 1,
  zones: ["eu-central-1b"],
}

export const ReadinessConditionTrue = {
  type: "ReadyCondition",
  status: "True",
  displayValue: "Ready",
  message: "All good",
  lastUpdateTime: "2025-10-09T05:00:00Z",
}

export const ReadinessConditionFalse = {
  type: "ControlPlaneHealthy",
  status: "False",
  displayValue: "CP",
  message: "All control plane components are not healthy.",
  lastUpdateTime: "2025-10-09T07:00:00Z",
}

export const ReadinessConditionPending = {
  type: "SystemComponentsHealthy",
  status: "Pending",
  displayValue: "CP",
  message:
    'ADeployment "kube-system/blackbox-exporter" is unhealthy: condition "Available" has invalid status False (expected True) due to MinimumReplicasUnavailable: Deployment does not have minimum availability.',
  lastUpdateTime: "2025-10-09T07:00:00Z",
}

export const ReadinessConditionUnknown = {
  type: "ObservabilityComponentsHealthy",
  status: "Unknown",
  displayValue: "OC",
  message: "Observability stack (Prometheus, Grafana, etc.) is not fully ready.",
  lastUpdateTime: "2025-10-09T08:00:00Z",
}

export const defaultCluster: Cluster = {
  uid: "12345678-1234-1234-1234-1234567890ab",
  name: "test-cluster",
  status: "Operational",
  region: "",
  namespace: "garden-dev",
  readiness: {
    status: "",
    conditions: [ReadinessConditionTrue],
  },
  purpose: "Testing",
  infrastructure: "AWS",
  version: "1.25.0",
  lastMaintenance: { state: "Succeeded" },
  workers: [worker1, worker2],
  maintenance: {
    startTime: "",
    timezone: "",
    windowTime: "",
  },
  autoUpdate: { os: false, kubernetes: false },
  raw: { some: "raw data" },
}

export const errorCluster: Cluster = {
  ...defaultCluster,
  uid: "12345678-1234-1234-1234-1234567890abc",
  name: "test-cluster2",
  status: "Error",
  readiness: {
    status: "",
    conditions: [ReadinessConditionFalse, ReadinessConditionUnknown],
  },
  lastMaintenance: { state: "Error" },
}

export const unknownStatusCluster: Cluster = {
  ...defaultCluster,
  uid: "12345678-1234-1234-1234-1234567890abc",
  name: "test-cluster-3",
  status: "Unknown",
  readiness: {
    status: "",
    conditions: [ReadinessConditionUnknown, ReadinessConditionPending],
  },
  lastMaintenance: { state: "Error" },
}

export const permissionsAllTrue: Permissions = {
  list: true,
  get: true,
  create: true,
  update: true,
  delete: true,
}

export const externalNetworks: ExternalNetwork[] = [
  { id: "net1", name: "net1", description: "desc", availability_zones: [], status: "active" },
]

export const cloudProfiles: CloudProfile[] = [
  {
    uid: "cp1",
    name: "cloud-profile-1",
    provider: "aws",
    providerConfig: { apiVersion: "v1" },
    kubernetesVersions: ["1.27.0", "1.26.5"],
    machineTypes: [
      { name: "m5.large", cpu: "2", memory: "8Gi" },
      { name: "m5.xlarge", cpu: "4", memory: "16Gi", architecture: "x86_64" },
    ],
    machineImages: [
      { name: "ubuntu", versions: ["22.04", "20.04"] },
      { name: "amazon-linux", versions: ["2.0"] },
    ],
    regions: [
      { name: "us-east-1", zones: ["us-east-1a", "us-east-1b"] },
      { name: "us-west-1", zones: ["us-west-1a", "us-west-1b"] },
    ],
    volumeTypes: ["gp2", "io1"],
  },
]
