import React from "react"
import WorkerGroupEditor from "./WorkerGroupEditor"
import { WorkerGroup } from "./types"
import { useWizard } from "./WizzardProvider"

const Step2 = () => {
  const { clusterFormData, setClusterFormData, cloudProfiles, selectedCloudProfile, region, formErrors, validateSingleField } = useWizard()

  const handleWorkersChange = (workers: WorkerGroup[]) => {
    setClusterFormData((prev) => ({
      ...prev,
      workers,
    }))
  }

  // Extract the specific data needed by WorkerGroupEditor
  const availableMachineTypes = selectedCloudProfile?.machineTypes ?? []
  const availableMachineImages = selectedCloudProfile?.machineImages ?? []
  const availableZones = selectedCloudProfile?.regions?.find((r) => r.name === region)?.zones ?? []

  return (
    <WorkerGroupEditor
      workers={clusterFormData.workers}
      onChange={handleWorkersChange}
      availableMachineTypes={availableMachineTypes}
      availableMachineImages={availableMachineImages}
      availableZones={availableZones}
      cloudProfileIsLoading={cloudProfiles.isLoading}
      cloudProfileError={cloudProfiles.error instanceof Error ? cloudProfiles.error : null}
      formErrors={formErrors}
      validateSingleField={validateSingleField}
    />
  )
}

export default Step2
