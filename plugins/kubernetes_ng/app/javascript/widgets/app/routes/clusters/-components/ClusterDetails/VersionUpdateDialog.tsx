import React, { useState, useMemo } from "react"
import {
  Modal,
  Button,
  Select,
  SelectOption,
  Stack,
  ModalFooter,
  ButtonRow,
  Message,
} from "@cloudoperators/juno-ui-components"
import { VersionUpdates } from "./KubernetesVersionDisplay"
import { useRouteContext } from "@tanstack/react-router"
import { RouterContext } from "../../../__root"
import { useUpdateClusterMutation } from "../../../../hooks/useClusterQueries"
import { normalizeError } from "../../../../components/InlineError"

interface VersionOption {
  version: string
  updateType: "patch" | "minor" | "major"
  label: string
  isDisabled: boolean
  disabledReason?: string
}

interface VersionUpdateDialogProps {
  clusterName: string
  currentVersion: string
  versionUpdates?: VersionUpdates | null
  onSuccess: () => void
  onCancel: () => void
}

const FooterActions = ({
  onConfirm,
  onCancel,
  selectedVersion,
  isUpdating,
}: {
  onConfirm: (version: string) => void
  onCancel: () => void
  selectedVersion: string
  isUpdating: boolean
}) => {
  const handleConfirm = () => {
    if (!selectedVersion) return
    onConfirm(selectedVersion)
  }

  return (
    <ModalFooter className="tw-justify-end tw-items-center">
      <ButtonRow>
        <Button onClick={onCancel} variant="subdued" disabled={isUpdating}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="primary"
          disabled={!selectedVersion || isUpdating}
          progress={isUpdating}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </ButtonRow>
    </ModalFooter>
  )
}

/**
 * Dialog for selecting and applying Kubernetes version updates
 *
 * Based on Gardener Dashboard's GShootVersionUpdate component:
 * - Groups versions by type (PATCH, MINOR, MAJOR)
 * - Displays patch versions first (safer updates)
 * - Enforces sequential minor version upgrades (can only upgrade one minor at a time)
 * - Shows disabled options with explanations for invalid upgrade paths
 */
export const VersionUpdateDialog: React.FC<VersionUpdateDialogProps> = ({
  clusterName,
  currentVersion,
  versionUpdates,
  onSuccess,
  onCancel,
}) => {
  const { apiClient } = useRouteContext({ strict: false }) as RouterContext
  const [selectedVersion, setSelectedVersion] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Use centralized mutation hook
  const updateClusterMutation = useUpdateClusterMutation(apiClient)

  // Handle update
  const handleUpdate = async () => {
    if (!selectedVersion) return

    setErrorMessage(null)

    try {
      await updateClusterMutation.mutateAsync({
        clusterName,
        data: { kubernetesVersion: selectedVersion },
      })

      onSuccess()
    } catch (error) {
      const errText = normalizeError(error)
      setErrorMessage(`${errText.title}${errText.message}`)
    }
  }

  // Parse current version
  const currentParsed = useMemo(() => {
    const parts = currentVersion.split(".").map(Number)
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    }
  }, [currentVersion])

  // Build version options with grouping and validation
  const versionOptions = useMemo((): VersionOption[] => {
    if (!versionUpdates) return []

    // Check if a minor version is the next minor version (sequential upgrade constraint)
    const isNextMinorVersion = (targetVersion: string): boolean => {
      const parts = targetVersion.split(".").map(Number)
      const targetMinor = parts[1] || 0
      const targetMajor = parts[0] || 0

      return targetMajor === currentParsed.major && targetMinor - currentParsed.minor === 1
    }

    const options: VersionOption[] = []
    const typeOrder = ["patch", "minor", "major"] as const

    typeOrder.forEach((type) => {
      const versions = versionUpdates[type]
      if (!versions || versions.length === 0) return

      // Add section header
      options.push({
        version: `__header_${type}`,
        updateType: type,
        label: type,
        isDisabled: true,
      })

      // Add version options
      versions.forEach((version) => {
        let isDisabled = false
        let disabledReason: string | undefined

        // For minor upgrades, enforce sequential upgrade constraint
        if (type === "minor" && !isNextMinorVersion(version)) {
          isDisabled = true
          disabledReason = "Can only upgrade one minor version at a time"
        }

        options.push({
          version,
          updateType: type,
          label: `${currentVersion} → ${version}`,
          isDisabled,
          disabledReason,
        })
      })
    })

    return options
  }, [versionUpdates, currentVersion, currentParsed])

  return (
    <Modal
      open={true}
      onCancel={onCancel}
      title="Update Kubernetes Version"
      size="large"
      modalFooter={
        <FooterActions
          onCancel={onCancel}
          onConfirm={handleUpdate}
          selectedVersion={selectedVersion}
          isUpdating={updateClusterMutation.isPending}
        />
      }
    >
      <Stack direction="vertical" gap="4">
        {errorMessage && <Message variant="error">{errorMessage}</Message>}
        <p>
          <strong>Note:</strong> Minor version upgrades must be sequential. You can only upgrade one minor version at a
          time (e.g., 1.27.x → 1.28.x). To upgrade further, perform multiple sequential upgrades.
        </p>
        <p>Select the target Kubernetes version for this cluster.</p>
        {versionOptions.length === 0 ? (
          <p>No updates available</p>
        ) : (
          <div>
            <Select
              id="version-select"
              label="Select version"
              value={selectedVersion}
              onChange={(value) => setSelectedVersion(String(value))}
              disabled={updateClusterMutation.isPending}
            >
              {versionOptions.map((option) => {
                // Section headers
                if (option.version.startsWith("__header_")) {
                  return <SelectOption key={option.version} value={option.version} label={option.label} disabled />
                }

                // Version options
                return (
                  <SelectOption
                    key={option.version}
                    value={option.version}
                    label={option.label}
                    disabled={option.isDisabled}
                    title={option.disabledReason}
                    className={option.isDisabled ? "tw-text-theme-disabled" : ""}
                  />
                )
              })}
            </Select>
          </div>
        )}
      </Stack>
    </Modal>
  )
}
