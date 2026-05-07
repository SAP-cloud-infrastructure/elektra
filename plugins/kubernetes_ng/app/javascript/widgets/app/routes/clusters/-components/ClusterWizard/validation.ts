import { WorkerGroup, ClusterFormData, ClusterFormErrorsFlat } from "./types"

export type FormErrors = Record<string, string[]>

/**
 * Helper functions
 */
const isValidCIDR = (cidr: string) => {
  const cidrRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/
  const match = cidr.match(cidrRegex)
  if (!match) return false

  const [, octet1, octet2, octet3, octet4, mask] = match
  const octets = [octet1, octet2, octet3, octet4].map(Number)
  const maskNum = Number(mask)

  // Check if all octets are 0-255 and mask is 0-32
  return octets.every((octet) => octet >= 0 && octet <= 255) && maskNum >= 0 && maskNum <= 32
}

const isRequired = (value: unknown) => (value ? [] : ["This field is required"])

const matchesRegex = (value: string, regex: RegExp, message: string) => (regex.test(value) ? [] : [message])

/**
 * Validate Step 1 - Cluster configuration
 */
export const validateStep1 = (data: ClusterFormData): ClusterFormErrorsFlat => {
  return {
    name: [
      ...isRequired(data.name),
      ...matchesRegex(
        data.name || "",
        /^[a-zA-Z][a-z0-9-]*$/,
        "Name must start with a letter, followed by lowercase alphanumeric characters or dashes"
      ),
      ...(data.name && data.name.length > 11 ? ["Name can be at most 11 characters long"] : []),
    ],
    cloudProfileName: isRequired(data.cloudProfileName),
    kubernetesVersion: isRequired(data.kubernetesVersion),
    "infrastructure.floatingPoolName": isRequired(data.infrastructure.floatingPoolName),
    "infrastructure.apiVersion": isRequired(data.infrastructure.apiVersion),
    "networking.pods":
      data?.networking?.pods && !isValidCIDR(data.networking.pods)
        ? ["Pods CIDR must be in valid CIDR notation (e.g., 10.0.0.0/16)"]
        : [],
    "networking.nodes":
      data?.networking?.nodes && !isValidCIDR(data.networking.nodes)
        ? ["Nodes CIDR must be in valid CIDR notation (e.g., 10.1.0.0/16)"]
        : [],
    "networking.services":
      data?.networking?.services && !isValidCIDR(data.networking.services)
        ? ["Services CIDR must be in valid CIDR notation (e.g., 10.2.0.0/16)"]
        : [],
    "infrastructure.networkWorkers":
      data?.infrastructure?.networkWorkers && !isValidCIDR(data.infrastructure.networkWorkers)
        ? ["Workers CIDR must be in valid CIDR notation (e.g., 10.3.0.0/16)"]
        : [],
  }
}

/**
 * Validate Step 2 - Worker groups
 * This is the single source of truth for worker validation used by both:
 * - ClusterWizard (Step2)
 * - WorkerGroupEditModal (for editing existing clusters)
 */
export const validateWorkers = (workers: WorkerGroup[]): FormErrors => {
  if (workers.length === 0) {
    return { workers: ["At least one worker node configuration is required"] }
  }
  const errors: FormErrors = {}
  workers.forEach((worker: WorkerGroup) => {
    if (!worker.name) {
      errors[`workers.${worker.id}.name`] = ["Name is required"]
    }
    if (!worker.machineType) {
      errors[`workers.${worker.id}.machineType`] = ["Machine type is required"]
    }
    if (!worker.machineImage.name) {
      errors[`workers.${worker.id}.machineImage.name`] = ["Machine image name is required"]
    }
    if (!worker.machineImage.version) {
      errors[`workers.${worker.id}.machineImage.version`] = ["Machine image version is required"]
    }
    if (worker.minimum < 0) {
      errors[`workers.${worker.id}.minimum`] = ["Minimum number of nodes cannot be negative"]
    }
    if (worker.maximum < 1) {
      errors[`workers.${worker.id}.maximum`] = ["Maximum number of nodes must be at least 1"]
    }
    if (worker.minimum > worker.maximum) {
      errors[`workers.${worker.id}.minimum`] = ["Minimum number of nodes cannot be greater than maximum"]
    } else if (worker.maximum < worker.minimum) {
      errors[`workers.${worker.id}.maximum`] = ["Maximum number of nodes must be greater than or equal to minimum"]
    }
    if (worker.maximum > 255) {
      errors[`workers.${worker.id}.maximum`] = ["Maximum number of nodes cannot exceed 255"]
    }
    if (worker.zones.length === 0) {
      errors[`workers.${worker.id}.zones`] = ["Available zones must be selected"]
    }
  })

  return errors
}
