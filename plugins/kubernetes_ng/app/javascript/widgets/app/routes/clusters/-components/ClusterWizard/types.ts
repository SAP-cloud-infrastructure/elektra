import { STEP_DEFINITIONS } from "./constants"

type StepDefinition = (typeof STEP_DEFINITIONS)[number]
export type StepId = StepDefinition["id"]
export type Step = StepDefinition & { hasError: boolean }

export type BasicInfo = {
  name: string
  cloudProfileName: string
  kubernetesVersion: string
}

export type Infrastructure = {
  infrastructure: {
    floatingPoolName: string
    apiVersion: string
  }
  networking?: {
    podsCIDR?: string
    nodesCIDR?: string
    servicesCIDR?: string
  }
}

export type WorkerGroups = {
  workers: WorkerGroup[]
}

export type WorkerGroup = {
  name: string
  machineType: string
  machineImage: {
    name: string
    version: string
  }
  minimum: number
  maximum: number
  zones: string[]
}

export type ClusterFormData = BasicInfo & Infrastructure & WorkerGroups

export type ValidationErrors<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? ValidationErrors<U>[] // For arrays
    : T[K] extends object
      ? ValidationErrors<T[K]> | string[] // For nested objects - can be either nested validation or string array
      : string[] // For primitive fields
}

export type ClusterFormErrors = ValidationErrors<ClusterFormData>
