import React from "react"
import { Icon, Tooltip, TooltipTrigger, TooltipContent, Stack } from "@cloudoperators/juno-ui-components"

export interface VersionUpdates {
  patch?: string[]
  minor?: string[]
  major?: string[]
}

export interface KubernetesVersionDisplayProps {
  version: string
  versionUpdates?: VersionUpdates | null
  className?: string
}

/**
 * KubernetesVersionDisplay component shows a Kubernetes version with status indicators
 *
 * Display logic:
 * - No versionUpdates (null/undefined): Shows version with help icon and tooltip (cloud profile data couldn't be fetched)
 * - Empty versionUpdates: Shows plain version text (no updates available)
 * - Has versionUpdates: Shows version with info icon and tooltip (updates available)
 *
 * @param version - The Kubernetes version string (e.g., "1.27.5")
 * @param versionUpdates - Object containing available updates grouped by type, null/undefined if couldn't check
 */
export const KubernetesVersionDisplay: React.FC<KubernetesVersionDisplayProps> = ({
  version,
  versionUpdates,
  className,
  ...props
}) => {
  // Determine icon and tooltip
  let icon: React.ReactNode | null = null
  let tooltip: string | null = null

  if (versionUpdates === null || versionUpdates === undefined) {
    icon = <Icon icon="help" />
    tooltip = "Unable to check for updates"
  } else {
    const hasPatch = !!versionUpdates.patch?.length
    const hasMinor = !!versionUpdates.minor?.length
    const hasMajor = !!versionUpdates.major?.length

    if (hasPatch || hasMinor || hasMajor) {
      icon = <Icon color="tw-text-theme-info" icon="info" />
      tooltip = hasPatch
        ? "Kubernetes patch available"
        : hasMinor
          ? "Kubernetes upgrade available"
          : "Updates available"
    }
  }

  return (
    <div className={`tw-flex ${className || ""}`} {...props}>
      {icon ? (
        <Tooltip triggerEvent="hover">
          <TooltipTrigger asChild>
            <div>
              <Stack gap="2">
                <span>{version}</span>
                {icon}
              </Stack>
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <span>{version}</span>
      )}
    </div>
  )
}
