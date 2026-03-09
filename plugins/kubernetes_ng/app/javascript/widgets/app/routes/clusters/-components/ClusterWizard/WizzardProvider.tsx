import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useRef, useEffect } from "react"
import { ClusterFormData, WorkerGroups, WorkerGroup, Step, StepId, ClusterFormErrorsFlat } from "./types"
import { STEP_DEFINITIONS, DEFAULT_CLOUD_PROFILE_NAME } from "./constants"
import { GardenerApi } from "../../../../apiClient"
import { useQuery, UseQueryResult, useMutation, UseMutationResult } from "@tanstack/react-query"
import { CloudProfile } from "../../../../types/cloudProfiles"
import { Cluster } from "../../../../types/cluster"
import { ExternalNetwork } from "../../../../types/network"

const getLatestVersion = (versions: string[] = []) => {
  if (versions.length === 0) return ""
  return versions
    .map((v) => v.split(".").map(Number))
    .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
    .join(".")
}

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
    case "summary":
      return {
        ...validateStep1(data),
        ...validateStep2(data),
      }
    default:
      return {}
  }
}

export interface WizardContextProps {
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
  createMutation: UseMutationResult<Cluster, unknown, ClusterFormData, unknown>
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
  formData: ClusterFormData
  children: ReactNode
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ client, region, formData, children }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [maxStepReached, setMaxStepReached] = useState<number>(0)
  const [steps, setSteps] = useState<Step[]>(STEP_DEFINITIONS.map((s) => ({ ...s, hasError: false })))

  const [clusterFormData, setClusterFormData] = useState<ClusterFormData>(formData)
  const [formErrors, setFormErrors] = useState<ClusterFormErrorsFlat>({})

  // Use ref to track latest form data without causing callback recreation
  const clusterFormDataRef = useRef(clusterFormData)
  clusterFormDataRef.current = clusterFormData

  // Track if defaults have been set to prevent re-setting on data changes
  const cloudProfileDefaultSet = useRef(false)
  const networkDefaultSet = useRef(false)

  // updates cloud profile, resets dependent fields
  const updateCloudProfile = useCallback(
    (prev: ClusterFormData, newName: string, profiles: CloudProfile[]): ClusterFormData => {
      const profile = profiles.find((p) => p.name === newName)
      const latestK8sVersion = profile ? getLatestVersion(profile.kubernetesVersions) : ""
      const apiVersion = profile ? profile.providerConfig.apiVersion : ""

      return {
        ...prev,
        cloudProfileName: newName,
        kubernetesVersion: latestK8sVersion,
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
    },
    []
  )

  const cloudProfiles = useQuery({
    queryKey: ["cloudProfiles"],
    queryFn: () => client.gardener.getCloudProfiles(),
    enabled: !!client.gardener.getCloudProfiles,
    select: (profiles) => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    staleTime: 0,
    cacheTime: 0,
  })

  const extNetworks = useQuery({
    queryKey: ["external-networks"],
    queryFn: () => client.gardener.getExternalNetworks(),
    enabled: !!client.gardener.getExternalNetworks,
    staleTime: 0,
    cacheTime: 0,
  })

  // Set cloud profile default as soon as data is available
  useEffect(() => {
    if (!cloudProfiles.data || cloudProfileDefaultSet.current) return

    setClusterFormData((prev) => {
      if (prev.cloudProfileName) {
        cloudProfileDefaultSet.current = true
        return prev
      }

      const defaultProfile =
        cloudProfiles.data.find((p) => p.name === DEFAULT_CLOUD_PROFILE_NAME) ?? cloudProfiles.data[0]
      cloudProfileDefaultSet.current = true
      return updateCloudProfile(prev, defaultProfile?.name, cloudProfiles.data)
    })
  }, [cloudProfiles.data, updateCloudProfile])

  // Set network default as soon as data is available
  useEffect(() => {
    if (!extNetworks.data || networkDefaultSet.current) return

    setClusterFormData((prev) => {
      if (prev.infrastructure.floatingPoolName) {
        networkDefaultSet.current = true
        return prev
      }

      networkDefaultSet.current = true
      return {
        ...prev,
        infrastructure: {
          ...prev.infrastructure,
          floatingPoolName: extNetworks.data[0]?.name || "",
        },
      }
    })
  }, [extNetworks.data])

  const createMutation = useMutation({
    mutationFn: client.gardener.createCluster,
    mutationKey: ["createCluster"],
  })

  const handleSetCurrentStep = useCallback(
    (step: number) => {
      let newMaxStepReached = Math.max(maxStepReached, step)

      // if the user navigates back one step, increment maxStepReached by 1 to ensure the previous step is validated,
      // while keeping it within the bounds of the total number of steps
      if (step < maxStepReached) {
        newMaxStepReached = Math.max(maxStepReached, Math.min(steps.length - 1, maxStepReached + 1))
      }

      // Always validate the summary step immediately when reached,
      // and ensure all steps are validated if we've reached the last step
      if (STEP_DEFINITIONS[step].id === "summary" || newMaxStepReached >= steps.length) {
        newMaxStepReached = steps.length
      }

      // define which steps to validate
      const stepsToValidate = STEP_DEFINITIONS.slice(0, newMaxStepReached)

      let newFormErrors: Record<string, string[]> = {}
      const newStepErrors: Record<string, { hasError: boolean }> = {}

      // validate all steps up to maxStepReached and collect errors
      stepsToValidate.forEach((s) => {
        const errors = validateStep(clusterFormDataRef.current, s.id)
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
    [maxStepReached, steps.length]
  )

  // selects the currently selected cloud profile based on form data
  const selectedCloudProfile = useMemo(() => {
    if (!cloudProfiles.data) return undefined
    return cloudProfiles.data.find((cp) => cp.name === clusterFormData.cloudProfileName)
  }, [cloudProfiles.data, clusterFormData.cloudProfileName])

  // updates a networking field, removes it if value is empty, and removes networking entirely if empty
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

  const validateSingleField = useCallback(
    (fieldPath: string) => {
      // Validate all steps once (cached)
      const validationByStep: Record<StepId, ClusterFormErrorsFlat> = {
        step1: validateStep1(clusterFormDataRef.current),
        step2: validateStep2(clusterFormDataRef.current),
        summary: {
          ...validateStep1(clusterFormDataRef.current),
          ...validateStep2(clusterFormDataRef.current),
        },
      }

      // Update only the specific field errors
      setFormErrors((prev) => ({
        ...prev,
        [fieldPath]: validationByStep.step1[fieldPath] || validationByStep.step2[fieldPath] || [],
      }))

      // update the hasError flag for the current step and also summary step if reached
      const stepErrors: Record<string, { hasError: boolean }> = {}

      STEP_DEFINITIONS.forEach((step) => {
        const errs = validationByStep[step.id]
        stepErrors[step.id] = {
          hasError: Object.values(errs).some((arr) => Array.isArray(arr) && arr.length > 0),
        }
      })

      // update haseError for for the current step and also update the summary step if reached already
      setSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          hasError: idx < maxStepReached || step.id === "summary" ? stepErrors[step.id].hasError : step.hasError,
        }))
      )
    },
    [maxStepReached]
  )

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
        createMutation,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}
