import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"
import {
  BasicInfoData,
  InfrastructureData,
  ClusterFormData,
  ClusterFormErrors,
  RegionValue,
  WorkerData,
  Step,
  StepId,
  ValidationErrors,
} from "./types"
import { CloudProfile } from "../../../../types/cloudProfiles"
import { useQuery } from "@tanstack/react-query"
import { stepDefinitions } from "./constants"

const DEFAULT_REGION_VALUE: RegionValue = "eu-de-1"
const DEFAULT_CLOUD_PROFILE_NAME = "converged-cloud"
const DEFAULT_BASIC_INFO = {
  name: "",
  cloudProfileName: "",
  region: DEFAULT_REGION_VALUE,
  kubernetesVersion: "",
}
const DEFAULT_INFRASCTRUCTURE = {
  infrastructure: {
    floatingPoolName: "",
  },
  networking: {
    pods: "",
    nodes: "",
    services: "",
  },
}
const DEFAULT_WORKER_NODES = {
  workers: [
    {
      machineType: "",
      machineImage: {
        name: "",
        version: "",
      },
      minimum: 0,
      maximum: 0,
      zones: [],
    },
  ],
}
const DEFAULT_CLUSTER_FORM_DATA: ClusterFormData = {
  ...DEFAULT_BASIC_INFO,
  ...DEFAULT_INFRASCTRUCTURE,
  ...DEFAULT_WORKER_NODES,
}

const validateBasicInfo = (data: BasicInfoData): ClusterFormErrors => {
  const errors: ClusterFormErrors = {}

  if (!data.name) {
    errors.name = ["Cluster name is required"]
  } else if (!/^[a-zA-Z][a-z0-9-]*$/.test(data.name)) {
    // Test: Starts with a letter, followed by lowercase alphanumeric characters or dashes ('-')
    errors.name = ["Name must start with a letter, followed by lowercase alphanumeric characters or dashes"]
  }

  return errors
}

const validateInfrastructure = (data: InfrastructureData): ClusterFormErrors => {
  const errors: ClusterFormErrors = {}
  if (!data.infrastructure.floatingPoolName) {
    errors.infrastructure = {
      floatingPoolName: ["Floating pool name is required"],
    }
  }
  if (!data.networking.pods) {
    errors.networking = {
      ...(errors.networking || {}),
      pods: ["Pod network CIDR is required"],
    }
  }
  if (!data.networking.nodes) {
    errors.networking = {
      ...(errors.networking || {}),
      nodes: ["Node network CIDR is required"],
    }
  }
  if (!data.networking.services) {
    errors.networking = {
      ...(errors.networking || {}),
      services: ["Service network CIDR is required"],
    }
  }
  return errors
}

const validateWorkers = (data: WorkerData): ClusterFormErrors => {
  // Use a separate property for array-level errors
  const errors: ValidationErrors<ClusterFormData> & { _workers?: string[] } = {}
  if (!data.workers || data.workers.length === 0) {
    // Error on the array itself
    errors._workers = ["At least one worker node configuration is required"]
  }

  const workerErrors: ClusterFormErrors["workers"] = []
  data.workers.forEach((worker, index) => {
    const wErrors: ClusterFormErrors = {}

    // ensure worker errors array exists
    wErrors.workers = wErrors.workers || []
    // / ensure object exists for this index
    wErrors.workers[index] = wErrors.workers[index] || {}

    if (!worker.machineType) {
      wErrors.workers[index].machineType = ["Machine type is required"]
    }
    if (!worker.machineImage.name) {
      wErrors.workers[index].machineImage = {
        ...(wErrors.workers[index].machineImage || {}),
        name: ["Machine image name is required"],
      }
    }
    if (worker.minimum < 1) {
      wErrors.workers[index].minimum = ["Minimum number of nodes must be at least 1"]
    }
    if (worker.maximum < worker.minimum) {
      wErrors.workers[index].maximum = ["Maximum number of nodes must be greater than or equal to minimum"]
    }
    if (worker.zones.length === 0) {
      wErrors.workers[index].zones = ["At least one zone must be selected"]
    }
  })

  if (workerErrors.length > 0) {
    errors.workers = workerErrors
  }
  return errors
}

const validateAll = (basicInfo: BasicInfoData, infra: InfrastructureData, workers: WorkerData) => {
  const basicErrors = validateBasicInfo(basicInfo)
  const infraErrors = validateInfrastructure(infra)
  const workerErrors = validateWorkers(workers)

  const allErrors = {
    ...basicErrors,
    ...infraErrors,
    ...workerErrors,
  }

  const stepErrors: Record<StepId, boolean> = {
    basicInfo: Object.keys(basicErrors).length > 0,
    infrastructure: Object.keys(infraErrors).length > 0,
    workerNodes: Object.keys(workerErrors).length > 0,
    review: false,
  }

  return { allErrors, stepErrors }
}

interface WizardContextProps {
  currentStep: number
  handleSetCurrentStep: (step: number) => void
  maxStepReached: number

  basicInfoData: BasicInfoData
  setBasicInfoData: React.Dispatch<React.SetStateAction<BasicInfoData>>

  infrastructureData: InfrastructureData
  setInfrastructureData: React.Dispatch<React.SetStateAction<InfrastructureData>>

  workerData: WorkerData
  setWorkerData: React.Dispatch<React.SetStateAction<WorkerData>>

  cloudProfiles?: CloudProfile[]
  isLoading: boolean
  error: unknown

  availableKubernetesVersions: string[]
  formErrors: ClusterFormErrors
  steps: Step[]
}

const WizardContext = createContext<WizardContextProps | undefined>(undefined)

export const useWizard = () => {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider")
  }
  return context
}

interface WizardProviderProps {
  children: ReactNode
  cloudProfilesPromise: Promise<CloudProfile[]>
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children, cloudProfilesPromise }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [maxStepReached, setMaxStepReached] = useState<number>(0)

  const [basicInfoData, setBasicInfoData] = useState<BasicInfoData>(DEFAULT_BASIC_INFO)
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureData>(DEFAULT_INFRASCTRUCTURE)
  const [workerData, setWorkerData] = useState<WorkerData>(DEFAULT_WORKER_NODES)

  const [steps, setSteps] = useState<Step[]>(stepDefinitions.map((s) => ({ ...s, hasError: false })))

  const [formErrors, setFormErrors] = useState<ClusterFormErrors>({})

  const {
    isLoading,
    data: cloudProfiles,
    error,
  } = useQuery({
    queryKey: ["cloudProfiles"],
    queryFn: () => cloudProfilesPromise,
    enabled: !!cloudProfilesPromise,
    select: (profiles) => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    onSuccess: (profiles) => {
      // set cloud profile or default
      const defaultCloudProfile = profiles.find((profile) => profile.name === DEFAULT_CLOUD_PROFILE_NAME) || profiles[0]
      setBasicInfoData((prev) => ({
        ...prev,
        cloudProfileName: defaultCloudProfile.name,
      }))
    },
  })

  const handleSetCurrentStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      setMaxStepReached((prev) => Math.max(prev, step))

      const { stepErrors, allErrors } = validateAll(basicInfoData, infrastructureData, workerData)

      setFormErrors(allErrors)

      setSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          hasError:
            idx < step // only steps <= currentStep show errors
              ? (stepErrors[s.id] ?? false)
              : s.hasError, // preserve previous state for future steps
        }))
      )
    },
    [basicInfoData, infrastructureData, workerData]
  )

  const selectedCloudProfile = cloudProfiles?.find((cp) => cp.name === basicInfoData.cloudProfileName)

  const availableKubernetesVersions = selectedCloudProfile?.kubernetesVersions ?? []

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        handleSetCurrentStep,
        maxStepReached,
        basicInfoData,
        setBasicInfoData,
        infrastructureData,
        setInfrastructureData,
        workerData,
        setWorkerData,
        cloudProfiles,
        error,
        isLoading,
        availableKubernetesVersions,
        formErrors,
        steps,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}
