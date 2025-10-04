import { Cluster } from "../types/cluster"

export const defaultCluster: Cluster = {
  uid: "12345678-1234-1234-1234-1234567890ab",
  name: "test-cluster",
  status: "Operational",
  region: "",
  readiness: {
    status: "",
    conditions: [
      { type: "Ready", status: "True", displayValue: "Ready" },
      { type: "ControlPlaneHealthy", status: "True", displayValue: "CP" },
    ],
  },
  purpose: "Testing",
  infrastructure: "AWS",
  version: "1.25.0",
  lastMaintenance: { state: "Succeeded" },
  workers: [],
  maintenance: {
    startTime: "",
    timezone: "",
    windowTime: "",
  },
  autoUpdate: { os: false, kubernetes: false },
}

export const errorCluster: Cluster = {
  ...defaultCluster,
  uid: "12345678-1234-1234-1234-1234567890abc",
  name: "test-cluster2",
  status: "Error",
  readiness: {
    status: "",
    conditions: [
      { type: "Ready", status: "False", displayValue: "Ready" },
      { type: "ControlPlaneHealthy", status: "False", displayValue: "CP" },
      { type: "APIServerAvailable", status: "Pending", displayValue: "API" },
    ],
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
    conditions: [
      { type: "Ready", status: "Pending", displayValue: "Ready" },
      { type: "ControlPlaneHealthy", status: "Pending", displayValue: "CP" },
      { type: "APIServerAvailable", status: "Pending", displayValue: "API" },
      { type: "ObservabilityComponentsHealthy", status: "Pending", displayValue: "OC" },
      { type: "EveryNodeReady", status: "Pending", displayValue: "N" },
      { type: "SystemComponentsHealthy", status: "Pending", displayValue: "SC" },
    ],
  },
  lastMaintenance: { state: "Error" },
}
