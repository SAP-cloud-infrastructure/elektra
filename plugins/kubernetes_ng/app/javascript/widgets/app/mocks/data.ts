import { Cluster } from "../types/clusters"

export const defaultCluster: Cluster = {
  uid: "12345678-1234-1234-1234-1234567890ab",
  name: "test-cluster",
  status: "Operational",
  region: "",
  readiness: {
    status: "",
    conditions: [
      { type: "Ready", status: "True", displayValue: "Ready" },
      { type: "ControlPlaneHealthy", status: "True", displayValue: "Control Plane Healthy" },
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
