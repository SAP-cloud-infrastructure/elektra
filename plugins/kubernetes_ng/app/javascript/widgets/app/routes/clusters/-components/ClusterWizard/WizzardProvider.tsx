import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react"
import {
  ClusterFormData,
  BasicInfo,
  Infrastructure,
  WorkerGroups,
  WorkerGroup,
  ClusterFormErrors,
  Step,
  StepId,
  ValidationErrors,
} from "./types"
import { STEP_DEFINITIONS, DEFAULT_CLOUD_PROFILE_NAME } from "./constants"
import { GardenerApi } from "../../../../apiClient"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { CloudProfile } from "../../../../types/cloudProfiles"
import { ExternalNetwork } from "../../../../types/network"

export const DEFAULT_WORKER_GROUP: WorkerGroup = {
  name: "",
  machineType: "",
  machineImage: {
    name: "",
    version: "",
  },
  minimum: 1,
  maximum: 1,
  zones: [],
}

const DEFAULT_CLUSTER_FORM_DATA: ClusterFormData = {
  name: "",
  cloudProfileName: "",
  kubernetesVersion: "",
  infrastructure: {
    floatingPoolName: "",
    apiVersion: "",
  },
  workers: [
    {
      ...DEFAULT_WORKER_GROUP,
      name: "worker1",
    },
  ],
}

const getLatestVersion = (versions: string[] = []) => {
  return versions
    .map((v) => v.split(".").map(Number))
    .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
    .join(".")
}

const validateStep1 = (data: BasicInfo & Infrastructure): ClusterFormErrors => {
  const errors: ClusterFormErrors = {}

  if (!data.name) {
    errors.name = ["Cluster name is required"]
  } else if (!/^[a-zA-Z][a-z0-9-]*$/.test(data.name)) {
    // Test: Starts with a letter, followed by lowercase alphanumeric characters or dashes ('-')
    errors.name = ["Name must start with a letter, followed by lowercase alphanumeric characters or dashes"]
  }

  if (!data.cloudProfileName) {
    errors.cloudProfileName = ["Cloud profile is required"]
  }

  if (!data.kubernetesVersion) {
    errors.kubernetesVersion = ["Kubernetes version is required"]
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

const validateStep2 = (data: WorkerGroups): ClusterFormErrors => {
  // Use a separate property for array-level errors
  const errors: ValidationErrors<ClusterFormData> & { _workers?: string[] } = {}
  if (!data.workers || data.workers.length === 0) {
    // Error on the array itself
    errors._workers = ["At least one worker node configuration is required"]
  }

  const workerErrors: ClusterFormErrors["workers"] = []
  data.workers.forEach((worker: WorkerGroup, index) => {
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
const validateAll = (formData: ClusterFormData) => {
  const step1Errors = validateStep1(formData)
  const step2Errors = validateStep2(formData)

  const allErrors = {
    ...step1Errors,
    ...step2Errors,
  }

  const stepErrors: Record<StepId, boolean> = {
    step1: Object.keys(step1Errors).length > 0,
    step2: Object.keys(step2Errors).length > 0,
    review: false,
  }

  return { allErrors, stepErrors }
}

interface WizardContextProps {
  client: GardenerApi

  currentStep: number
  handleSetCurrentStep: (step: number) => void
  maxStepReached: number

  clusterFormData: ClusterFormData
  setClusterFormData: React.Dispatch<React.SetStateAction<ClusterFormData>>

  formErrors: ClusterFormErrors
  steps: Step[]

  cloudProfiles: UseQueryResult<CloudProfile[], unknown>
  selectedCloudProfile?: CloudProfile
  updateCloudProfile: (prev: ClusterFormData, newName: string, profiles: CloudProfile[]) => ClusterFormData
  updateNetworkingField: (
    prev: ClusterFormData,
    field: keyof NonNullable<ClusterFormData["networking"]>,
    value: string
  ) => ClusterFormData
  extNetworks: UseQueryResult<ExternalNetwork[], unknown>

  region: string
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
  region: string
  children: ReactNode
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children, client, region }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [maxStepReached, setMaxStepReached] = useState<number>(0)
  const [steps, setSteps] = useState<Step[]>(STEP_DEFINITIONS.map((s) => ({ ...s, hasError: false })))

  const [clusterFormData, setClusterFormData] = useState<ClusterFormData>(DEFAULT_CLUSTER_FORM_DATA)
  const [formErrors, setFormErrors] = useState<ClusterFormErrors>({})

  const cloudProfiles = useQuery({
    queryKey: ["cloudProfiles"],
    queryFn: () => client.gardener.getCloudProfiles(),
    enabled: !!client.gardener.getCloudProfiles,
    select: (profiles) => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    onSuccess: (profiles) => {
      setClusterFormData((prev) => {
        // don’t override if user selected something
        if (prev.cloudProfileName) return prev
        // check if default cloud profile exists or take the first one
        const defaultCloudProfile = profiles.find((p) => p.name === DEFAULT_CLOUD_PROFILE_NAME) ?? profiles[0]
        return updateCloudProfile(prev, defaultCloudProfile?.name, profiles)
      })
    },
  })

  const extNetworks = useQuery({
    queryKey: ["external-networks"],
    queryFn: () => client.gardener.getExternalNetworks(),
    enabled: !!client.gardener.getExternalNetworks,
    onSuccess: (networks) => {
      setClusterFormData((prev) => {
        // don’t override if user selected something
        if (prev.infrastructure.floatingPoolName) return prev
        // set the first as default
        return {
          ...prev,
          infrastructure: {
            ...prev.infrastructure,
            floatingPoolName: networks[0]?.name || "",
          },
        }
      })
    },
  })

  const handleSetCurrentStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      setMaxStepReached((prev) => Math.max(prev, step))

      const { stepErrors, allErrors } = validateAll(clusterFormData)

      setFormErrors(allErrors)

      setSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          hasError: idx < step ? (stepErrors[s.id] ?? false) : s.hasError,
        }))
      )
    },
    [clusterFormData]
  )

  const selectedCloudProfile = useMemo(() => {
    if (!cloudProfiles.data) return undefined
    return cloudProfiles.data.find((cp) => cp.name === clusterFormData.cloudProfileName)
  }, [cloudProfiles.data, clusterFormData.cloudProfileName])

  const updateCloudProfile = (prev: ClusterFormData, newName: string, profiles: CloudProfile[]): ClusterFormData => {
    const profile = profiles.find((p) => p.name === newName)
    const latestK8sVersion = profile ? getLatestVersion(profile.kubernetesVersions) : ""
    const apiVersion = profile ? profile.providerConfig.apiVersion : ""

    return {
      ...prev,
      cloudProfileName: newName,
      // reset to latest kubernetes version of new profile
      kubernetesVersion: latestK8sVersion,
      // reset infrastructure apiVersion
      infrastructure: {
        ...prev.infrastructure,
        apiVersion: apiVersion,
      },
      workers: prev.workers.map((wg) => ({
        ...wg,
        machineType: "",
        machineImage: {
          name: "",
          version: "",
        },
        zones: [],
      })),
    }
  }

  const updateNetworkingField = (
    prev: ClusterFormData,
    field: keyof NonNullable<ClusterFormData["networking"]>,
    value: string
  ): ClusterFormData => {
    const newNetworking = { ...(prev.networking || {}) }

    if (!value.trim()) {
      delete newNetworking[field]
    } else {
      newNetworking[field] = value
    }

    // remove networking entirely if empty
    const updatedCluster: ClusterFormData = { ...prev }
    if (Object.keys(newNetworking).length === 0) {
      delete updatedCluster.networking
    } else {
      updatedCluster.networking = newNetworking
    }

    return updatedCluster
  }

  return (
    <WizardContext.Provider
      value={{
        client,
        currentStep,
        handleSetCurrentStep,
        maxStepReached,
        clusterFormData,
        setClusterFormData,
        formErrors,
        steps,
        selectedCloudProfile,
        updateCloudProfile,
        updateNetworkingField,
        cloudProfiles,
        extNetworks,
        region,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}
