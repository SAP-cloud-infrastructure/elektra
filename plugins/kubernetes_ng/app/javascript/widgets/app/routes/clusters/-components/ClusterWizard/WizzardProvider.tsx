import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react"
import { ClusterFormData, WorkerGroups, WorkerGroup, Step, StepId, ClusterFormErrorsFlat } from "./types"
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
      id: `worker-${Date.now()}`,
    },
  ],
}

const getLatestVersion = (versions: string[] = []) => {
  return versions
    .map((v) => v.split(".").map(Number))
    .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
    .join(".")
}

const isRequired = (value: any) => (value ? [] : ["This field is required"])

const matchesRegex = (value: string, regex: RegExp, message: string) => (regex.test(value) ? [] : [message])

const validateStep1 = (data: ClusterFormData): ClusterFormErrorsFlat => {
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
    "networking.podsCIDR":
      data?.networking?.podsCIDR && !/^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/.test(data.networking.podsCIDR)
        ? ["Pods CIDR must be in CIDR notation"]
        : [],
    "networking.nodesCIDR":
      data?.networking?.nodesCIDR && !/^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/.test(data.networking.nodesCIDR)
        ? ["Nodes CIDR must be in CIDR notation"]
        : [],
    "networking.servicesCIDR":
      data?.networking?.servicesCIDR &&
      data?.networking?.nodesCIDR &&
      !/^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/.test(data.networking.nodesCIDR)
        ? ["Nodes CIDR must be in CIDR notation"]
        : [],
  }
}

const validateStep2 = (data: WorkerGroups): ClusterFormErrorsFlat => {
  if (data.workers.length === 0) {
    return { workers: ["At least one worker node configuration is required"] }
  }
  const errors: ClusterFormErrorsFlat = {}
  data.workers.forEach((worker: WorkerGroup) => {
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
    if (worker.minimum < 1) {
      errors[`workers.${worker.id}.minimum`] = ["Minimum number of nodes must be at least 1"]
    }
    if (worker.maximum < worker.minimum) {
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

function validateStep(data: ClusterFormData, stepId: StepId): ClusterFormErrorsFlat {
  switch (stepId) {
    case "step1":
      return validateStep1(data)
    case "step2":
      return validateStep2(data)
    case "review":
      return {} // maybe no validation here
  }
}

interface WizardContextProps {
  client: GardenerApi

  currentStep: number
  handleSetCurrentStep: (step: number) => void
  maxStepReached: number

  clusterFormData: ClusterFormData
  setClusterFormData: React.Dispatch<React.SetStateAction<ClusterFormData>>

  formErrors: ClusterFormErrorsFlat
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
  validateSingleField: (fieldPath: string) => void

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
  const [formErrors, setFormErrors] = useState<ClusterFormErrorsFlat>({})

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
      const newMaxStepReached = Math.max(maxStepReached, step)
      setMaxStepReached(newMaxStepReached)

      // define which steps to validate
      const stepsToValidate = STEP_DEFINITIONS.slice(0, newMaxStepReached)
      let newFormErrors: Record<string, any> = {}
      const newStepErrors: Record<string, { hasError: boolean }> = {}

      // validate all steps up to maxStepReached and collect errors
      stepsToValidate.forEach((s) => {
        const errors = validateStep(clusterFormData, s.id)
        newFormErrors = { ...errors, ...newFormErrors }
        newStepErrors[s.id] = { hasError: Object.values(errors).some((arr) => Array.isArray(arr) && arr.length > 0) }
      })

      // updated hasError up to the maxStepReached
      const newSteps = STEP_DEFINITIONS.map((s, idx) => ({
        ...s,
        hasError: idx < newMaxStepReached ? (newStepErrors[s.id]?.hasError ?? false) : false,
      }))

      // update all states at once
      setCurrentStep(step)
      setMaxStepReached(newMaxStepReached)
      setFormErrors((prev) => ({ ...prev, ...newFormErrors }))
      setSteps(newSteps)
    },
    [clusterFormData, maxStepReached]
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

  const validateSingleField = (fieldPath: string) => {
    const step1Errors = validateStep1(clusterFormData)
    const step2Errors = validateStep2(clusterFormData)
    const allErrors = { ...step1Errors, ...step2Errors }

    setFormErrors((prev) => ({
      ...prev,
      [fieldPath]: allErrors[fieldPath] || [],
    }))
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
        validateSingleField,
        cloudProfiles,
        extNetworks,
        region,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}
