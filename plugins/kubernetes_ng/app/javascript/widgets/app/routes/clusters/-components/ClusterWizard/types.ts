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
    networkWorkers?: string
  }
  networking?: {
    pods?: string
    nodes?: string
    services?: string
  }
}

export type WorkerGroups = {
  workers: WorkerGroup[]
}

export type WorkerGroup = {
  name: string
  id: string
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

export type ClusterFormErrorsFlat = Record<string, string[]>
