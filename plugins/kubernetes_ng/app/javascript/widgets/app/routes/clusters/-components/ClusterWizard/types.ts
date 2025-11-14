import { regionOptions, stepDefinitions } from "./constants"

export type RegionValue = (typeof regionOptions)[number]["value"]

type StepDefinition = (typeof stepDefinitions)[number]
export type StepId = StepDefinition["id"]
export type Step = StepDefinition & { hasError: boolean }

export type BasicInfoData = {
  name: string
  cloudProfileName: string
  region: RegionValue
  kubernetesVersion: string
}

export type InfrastructureData = {
  infrastructure: {
    floatingPoolName: string
  }
  networking: {
    pods: string
    nodes: string
    services: string
  }
}

export type WorkerData = {
  workers: {
    machineType: string
    machineImage: {
      name: string
      version: string
    }
    minimum: number
    maximum: number
    zones: string[]
  }[]
}

export type ClusterFormData = BasicInfoData & InfrastructureData & WorkerData

export type ValidationErrors<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? ValidationErrors<U>[] // For arrays
    : T[K] extends object
      ? ValidationErrors<T[K]> | string[] // For nested objects - can be either nested validation or string array
      : string[] // For primitive fields
}

export type ClusterFormErrors = ValidationErrors<ClusterFormData>
