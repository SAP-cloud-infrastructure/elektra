import React, { useState, useMemo, useRef } from "react"
import {
  Modal,
  ModalFooter,
  Button,
  ButtonRow,
  FormRow,
  DateTimePicker,
  TextInput,
  Checkbox,
  Message,
} from "@cloudoperators/juno-ui-components"
import type { Maintenance, AutoUpdate } from "../../../../types/cluster"
import {
  validateMaintenance,
  validateSingleMaintenanceField,
  hasValidationErrors as checkValidationErrors,
  type MaintenanceFormData,
  type MaintenanceFormErrors,
} from "./maintenanceValidation"
import {
  formatTimezoneDisplay,
  parseTimeString,
  calculateDurationFromFormattedTimes,
} from "../../../../utils/maintenanceTime"
import { useRouteContext } from "@tanstack/react-router"
import { RouterContext } from "../../../__root"
import { useUpdateClusterMutation } from "../../../../hooks/useClusterQueries"
import { normalizeError } from "../../../../components/InlineError"

type MaintenanceWindowEditModalProps = {
  clusterName: string
  maintenance: Maintenance
  autoUpdate: AutoUpdate
  hasWorkers: boolean
  onSuccess: () => void
  onCancel: () => void
}

const MaintenanceWindowEditModal: React.FC<MaintenanceWindowEditModalProps> = ({
  clusterName,
  maintenance,
  autoUpdate,
  hasWorkers,
  onSuccess,
  onCancel,
}) => {
  const { apiClient } = useRouteContext({ strict: false }) as RouterContext

  // Form state - initialized with current maintenance data on mount
  const [formData, setFormData] = useState<MaintenanceFormData>(() => {
    const startTimeDisplay = maintenance.startTime || "22:00"
    const timezoneDisplay = formatTimezoneDisplay(maintenance.timezone)
    const duration = calculateDurationFromFormattedTimes(maintenance.startTime, maintenance.endTime) || 60

    return {
      startTime: startTimeDisplay,
      timezone: timezoneDisplay,
      duration: duration,
      autoUpdateKubernetes: autoUpdate.kubernetes,
      autoUpdateOS: autoUpdate.os,
    }
  })
  const [formErrors, setFormErrors] = useState<MaintenanceFormErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Store initial values for change detection
  const initialValuesRef = useRef<MaintenanceFormData>(formData)

  // Use centralized mutation hook
  const updateClusterMutation = useUpdateClusterMutation(apiClient)

  // Change detection
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialValuesRef.current)
  }, [formData])

  // Validation
  const validationErrors = useMemo(() => validateMaintenance(formData), [formData])
  const hasValidationErrors = checkValidationErrors(validationErrors)

  // Form validity
  const isFormValid = !hasValidationErrors && hasChanges

  // Single field validation (for blur events)
  const validateSingleField = (fieldName: keyof MaintenanceFormData) => {
    const errors = validateSingleMaintenanceField(fieldName, formData)
    setFormErrors((prev) => ({
      ...prev,
      [fieldName]: errors,
    }))
  }

  // Handle save
  const handleSave = async () => {
    setErrorMessage(null)

    if (!isFormValid) {
      setFormErrors(validationErrors)
      setErrorMessage("Please fix validation errors before saving")
      return
    }

    // Parse time components to calculate end time
    const timeParts = parseTimeString(formData.startTime)
    if (!timeParts) {
      setErrorMessage("Invalid start time format")
      return
    }

    // Calculate end time in display format (HH:MM)
    const startMinutes = parseInt(timeParts.hours, 10) * 60 + parseInt(timeParts.minutes, 10)
    const endMinutes = (startMinutes + formData.duration) % (24 * 60)
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTimeDisplay = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`

    try {
      // Update the cluster using the centralized mutation
      await updateClusterMutation.mutateAsync({
        clusterName,
        data: {
          maintenance: {
            startTime: formData.startTime,
            endTime: endTimeDisplay,
            timezone: formData.timezone,
          },
          autoUpdate: {
            os: formData.autoUpdateOS,
            kubernetes: formData.autoUpdateKubernetes,
          },
        },
      })

      onSuccess()
    } catch (error) {
      const errText = normalizeError(error)
      setErrorMessage(`${errText.title}${errText.message}`)
    }
  }

  return (
    <Modal
      open={true}
      size="large"
      aria-modal={true}
      title="Edit Maintenance Window"
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
        <div className="tw-mb-4">
          <Message variant="error">{errorMessage}</Message>
        </div>
      )}

      <FormRow>
        <DateTimePicker
          label="Start Time"
          required
          enableTime={true}
          noCalendar={true}
          time_24hr={true}
          dateFormat="H:i"
          value={formData.startTime}
          onChange={(dates, dateStr) => {
            setFormData({ ...formData, startTime: dateStr || "" })
          }}
          onBlur={() => validateSingleField("startTime")}
          errortext={formErrors.startTime?.[0]}
          helptext="Select the start time for the maintenance window"
        />
      </FormRow>

      <FormRow>
        <TextInput
          label="Timezone"
          required
          placeholder="+00:00"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          onBlur={() => validateSingleField("timezone")}
          errortext={formErrors.timezone?.[0]}
          helptext="Format: +HH:MM or -HH:MM (e.g., +01:00, -05:00)"
        />
      </FormRow>

      <FormRow>
        <TextInput
          label="Duration (minutes)"
          required
          type="number"
          min={30}
          max={360}
          value={formData.duration.toString()}
          onChange={(e) => {
            const value = e.target.value
            setFormData({ ...formData, duration: value ? parseInt(value, 10) : 0 })
          }}
          onBlur={() => validateSingleField("duration")}
          errortext={formErrors.duration?.[0]}
          helptext="Minimum: 30 minutes, Maximum: 360 minutes (6 hours)"
        />
      </FormRow>

      <FormRow>
        <Checkbox
          checked={formData.autoUpdateKubernetes}
          onChange={(e) => setFormData({ ...formData, autoUpdateKubernetes: e.target.checked })}
          label="Auto-update Kubernetes Version"
          helptext="Automatically update to the latest Kubernetes version during maintenance"
        />
      </FormRow>

      {hasWorkers && (
        <FormRow>
          <Checkbox
            checked={formData.autoUpdateOS}
            onChange={(e) => setFormData({ ...formData, autoUpdateOS: e.target.checked })}
            label="Auto-update Operating System"
            helptext="Automatically update machine images to the latest OS version during maintenance"
          />
        </FormRow>
      )}
    </Modal>
  )
}

export default MaintenanceWindowEditModal
