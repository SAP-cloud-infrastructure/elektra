import { stepDefinitions } from "./constants"

type StepDefinition = (typeof stepDefinitions)[number]
export type StepId = StepDefinition["id"]
export type Step = StepDefinition & { hasError: boolean }

export type BasicInfo = {
  name: string
  cloudProfileName: string
  kubernetesVersion: string
}

export type Infrastructure = {
  infrastructure?: {
    floatingPoolName: string
  }
  networking?: {
    pods: string
    nodes: string
    services: string
  }
}

export type WorkerGroup = {
  workers: {
    machineType: string
    machineImage?: {
      name: string
      version: string
    }
    minimum: number
    maximum: number
    zones: string[]
  }[]
}

export type ClusterFormData = BasicInfo & Infrastructure & WorkerGroup

export type ValidationErrors<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? ValidationErrors<U>[] // For arrays
    : T[K] extends object
      ? ValidationErrors<T[K]> | string[] // For nested objects - can be either nested validation or string array
      : string[] // For primitive fields
}

export type ClusterFormErrors = ValidationErrors<ClusterFormData>
