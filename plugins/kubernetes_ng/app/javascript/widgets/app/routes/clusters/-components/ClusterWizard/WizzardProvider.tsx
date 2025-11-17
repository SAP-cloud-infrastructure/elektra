import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"
import {
  ClusterFormData,
  BasicInfo,
  Infrastructure,
  WorkerGroup,
  ClusterFormErrors,
  Step,
  StepId,
  ValidationErrors,
} from "./types"
import { stepDefinitions } from "./constants"
import { GardenerApi } from "../../../../apiClient"

const DEFAULT_BASIC_INFRA_DATA: BasicInfo & Infrastructure = {
  name: "",
  cloudProfileName: "",
  kubernetesVersion: "",
  infrastructure: {
    floatingPoolName: "",
  },
  networking: {
    pods: "",
    nodes: "",
    services: "",
  },
}
const DEFAULT_WORKER_GROUP: WorkerGroup = {
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
  ...DEFAULT_BASIC_INFRA_DATA,
  ...DEFAULT_WORKER_GROUP,
}

const validateBasicInfo = (data: BasicInfo & Infrastructure): ClusterFormErrors => {
  const errors: ClusterFormErrors = {}

  if (!data.name) {
    errors.name = ["Cluster name is required"]
  } else if (!/^[a-zA-Z][a-z0-9-]*$/.test(data.name)) {
    // Test: Starts with a letter, followed by lowercase alphanumeric characters or dashes ('-')
    errors.name = ["Name must start with a letter, followed by lowercase alphanumeric characters or dashes"]
  }

  // if (!data?.infrastructure?.floatingPoolName) {
  //   errors.infrastructure = {
  //     floatingPoolName: ["Floating pool name is required"],
  //   }
  // }
  // if (!data?.networking?.pods) {
  //   errors.networking = {
  //     ...(errors.networking || {}),
  //     pods: ["Pod network CIDR is required"],
  //   }
  // }
  // if (!data?.networking?.nodes) {
  //   errors.networking = {
  //     ...(errors.networking || {}),
  //     nodes: ["Node network CIDR is required"],
  //   }
  // }
  // if (!data?.networking?.services) {
  //   errors.networking = {
  //     ...(errors.networking || {}),
  //     services: ["Service network CIDR is required"],
  //   }
  // }

  return errors
}

const validateWorkers = (data: WorkerGroup): ClusterFormErrors => {
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

const validateAll = (basicAndInfraData: BasicInfo & Infrastructure, workerGroup: WorkerGroup) => {
  const basicInfraErrors = validateBasicInfo(basicAndInfraData)
  const workerErrors = validateWorkers(workerGroup)

  const allErrors = {
    ...basicInfraErrors,
    ...workerErrors,
  }

  const stepErrors: Record<StepId, boolean> = {
    basicInfoInfrastructure: Object.keys(basicInfraErrors).length > 0,
    workerGroups: Object.keys(workerErrors).length > 0,
    review: false,
  }

  return { allErrors, stepErrors }
}

interface WizardContextProps {
  client: GardenerApi

  currentStep: number
  handleSetCurrentStep: (step: number) => void
  maxStepReached: number

  basicAndInfraData: BasicInfo & Infrastructure
  setBasicAndInfraData: React.Dispatch<React.SetStateAction<BasicInfo & Infrastructure>>
  workerGroupData: WorkerGroup
  setWorkerGroupData: React.Dispatch<React.SetStateAction<WorkerGroup>>

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
  client: GardenerApi
  children: ReactNode
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children, client }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [maxStepReached, setMaxStepReached] = useState<number>(0)

  const [basicAndInfraData, setBasicAndInfraData] = useState<BasicInfo & Infrastructure>(DEFAULT_BASIC_INFRA_DATA)
  const [workerGroupData, setWorkerGroupData] = useState<WorkerGroup>(DEFAULT_WORKER_GROUP)

  const [steps, setSteps] = useState<Step[]>(stepDefinitions.map((s) => ({ ...s, hasError: false })))

  const [formErrors, setFormErrors] = useState<ClusterFormErrors>({})

  const handleSetCurrentStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      setMaxStepReached((prev) => Math.max(prev, step))

      const { stepErrors, allErrors } = validateAll(basicAndInfraData, workerGroupData)

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
    [basicAndInfraData, workerGroupData]
  )

  return (
    <WizardContext.Provider
      value={{
        client,
        currentStep,
        handleSetCurrentStep,
        maxStepReached,
        basicAndInfraData,
        setBasicAndInfraData,
        workerGroupData,
        setWorkerGroupData,
        formErrors,
        steps,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}
