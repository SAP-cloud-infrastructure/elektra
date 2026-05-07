import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Modal, Message, ModalFooter, ButtonRow, Button } from "@cloudoperators/juno-ui-components"
import { useRouteContext } from "@tanstack/react-router"
import WorkerGroupEditor from "../ClusterWizard/WorkerGroupEditor"
import { Worker } from "../../../../types/cluster"
import { WorkerGroup } from "../ClusterWizard/types"
import { useCloudProfileData } from "../../../../hooks/useCloudProfileQueries"
import { useUpdateClusterMutation } from "../../../../hooks/useClusterQueries"
import { validateWorkers, FormErrors } from "../ClusterWizard/validation"
import { RouterContext } from "../../../__root"
import { normalizeError } from "../../../../components/InlineError"

type WorkerGroupEditModalProps = {
  open: boolean
  clusterName: string
  workers: Worker[]
  cloudProfileName: string
  region: string
  onSuccess: () => void
  onCancel: () => void
}

// Convert Worker to WorkerGroup for editing
const workerToWorkerGroup = (worker: Worker, index: number): WorkerGroup => ({
  id: `worker-${index}-${Date.now()}`,
  name: worker.name,
  machineType: worker.machineType,
  machineImage: {
    name: worker.machineImage.name,
    version: worker.machineImage.version,
  },
  minimum: worker.min,
  maximum: worker.max,
  zones: worker.zones,
})

const WorkerGroupEditModal: React.FC<WorkerGroupEditModalProps> = ({
  clusterName,
  workers,
  cloudProfileName,
  region,
  onSuccess,
  onCancel,
  open,
}) => {
  const { apiClient } = useRouteContext({ strict: false }) as RouterContext

  // Store initial worker groups to detect changes (captured once on mount)
  const initialWorkerGroupsRef = useRef<WorkerGroup[]>(workers.map((w, i) => workerToWorkerGroup(w, i)))

  const [workerGroups, setWorkerGroups] = useState<WorkerGroup[]>(initialWorkerGroupsRef.current)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Ref for error message to scroll to it
  const errorMessageRef = useRef<HTMLDivElement>(null)

  // Use centralized mutation hook
  const updateClusterMutation = useUpdateClusterMutation(apiClient)

  // Fetch cloud profile data using shared hook
  const { availableMachineTypes, availableMachineImages, availableZones, isLoading, error } = useCloudProfileData(
    apiClient,
    cloudProfileName,
    region,
    open
  )

  // Validate a single field
  const validateSingleField = useCallback(
    (fieldPath: string) => {
      const allErrors = validateWorkers(workerGroups)
      setFormErrors((prev) => ({
        ...prev,
        [fieldPath]: allErrors[fieldPath] || [],
      }))
    },
    [workerGroups]
  )

  // Validate all workers and memoize the result
  const validationErrors = useMemo(() => validateWorkers(workerGroups), [workerGroups])
  const hasValidationErrors = Object.values(validationErrors).some((arr) => Array.isArray(arr) && arr.length > 0)

  // Check if worker groups have changed
  const hasChanges = useMemo(() => {
    return JSON.stringify(workerGroups) !== JSON.stringify(initialWorkerGroupsRef.current)
  }, [workerGroups])

  // Form is valid only if there are no validation errors AND cloud profile data has loaded AND there are changes
  const isFormValid = !hasValidationErrors && !isLoading && hasChanges

  // Scroll to error message when it appears
  useEffect(() => {
    if (errorMessage && errorMessageRef.current) {
      errorMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [errorMessage])

  const handleSave = async () => {
    // Clear previous errors
    setErrorMessage(null)

    if (!isFormValid) {
      setFormErrors(validationErrors)
      setErrorMessage("Please fix validation errors before saving")
      return
    }

    try {
      // Update the cluster using the centralized mutation
      await updateClusterMutation.mutateAsync({
        clusterName,
        data: { workers: workerGroups },
      })

      onSuccess()
    } catch (error) {
      const errText = normalizeError(error)
      setErrorMessage(`${errText.title}${errText.message}`)
    }
  }

  return (
    <Modal
      className="tw-w-[76.75rem]"
      open={open}
      size="large"
      aria-modal={true}
      title="Edit Worker Groups"
      onCancel={onCancel}
      modalFooter={
        <ModalFooter className="tw-justify-end tw-items-center">
          <ButtonRow>
            <Button onClick={onCancel} variant="default">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || updateClusterMutation.isPending}
              progress={updateClusterMutation.isPending}
              variant="primary"
            >
              Save Changes
            </Button>
          </ButtonRow>
        </ModalFooter>
      }
    >
      {errorMessage && (
        <div ref={errorMessageRef} className="tw-mb-4">
          <Message variant="error">{errorMessage}</Message>
        </div>
      )}
      <WorkerGroupEditor
        workers={workerGroups}
        onChange={setWorkerGroups}
        availableMachineTypes={availableMachineTypes}
        availableMachineImages={availableMachineImages}
        availableZones={availableZones}
        cloudProfileIsLoading={isLoading}
        cloudProfileError={error}
        formErrors={formErrors}
        validateSingleField={validateSingleField}
      />
    </Modal>
  )
}

export default WorkerGroupEditModal
