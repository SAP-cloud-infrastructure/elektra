import React from "react"
import { Badge, Tooltip, TooltipTrigger, TooltipContent, Spinner } from "@cloudoperators/juno-ui-components"

export interface VersionUpdates {
  patch?: string[]
  minor?: string[]
  major?: string[]
}

export interface VersionBadgeProps {
  version: string
  versionUpdates?: VersionUpdates | null
  tooltipText?: string
  isLoading?: boolean
  hasError?: boolean
  className?: string
}

/**
 * VersionBadge component displays a Kubernetes version with optional update indicators
 *
 * Based on Gardener Dashboard's GShootVersionChip component behavior:
 * - Shows version number as badge text
 * - Displays update icon (↑) when patches, minor upgrades, or major upgrades are available
 * - Tooltip shows update status with priority: patch > minor > major > generic "updates available"
 * - Badge variant changes based on update availability
 *
 * @param version - The Kubernetes version string (e.g., "1.27.5")
 * @param versionUpdates - Object containing available updates grouped by type
 * @param tooltipText - Optional custom tooltip text
 * @param isLoading - Whether update information is still loading
 * @param hasError - Whether there was an error fetching update information
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  versionUpdates,
  tooltipText,
  isLoading = false,
  hasError = false,
  className,
  ...props
}) => {
  // Show plain text with spinner while loading
  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <span>{version}</span>
        <Spinner size="small" />
      </div>
    )
  }

  // Show plain text if there was an error fetching cloud profiles
  if (hasError) {
    return <span>{version}</span>
  }

  const hasPatchAvailable = !!versionUpdates?.patch?.length
  const hasUpgradeAvailable = !!versionUpdates?.minor?.length
  const hasMajorAvailable = !!versionUpdates?.major?.length
  const hasUpdates = hasPatchAvailable || hasUpgradeAvailable || hasMajorAvailable

  // Determine tooltip text with priority: custom > patch > minor > major > no updates
  const getTooltipText = (): string => {
    if (tooltipText) return tooltipText
    if (hasPatchAvailable) return "Kubernetes patch available"
    if (hasUpgradeAvailable) return "Kubernetes upgrade available"
    if (hasMajorAvailable) return "Updates available"
    return "No updates available"
  }

  // Determine badge variant based on update availability
  const variant = hasUpdates ? "info" : "success"

  return (
    <div className={`tw-flex ${className || ""}`} {...props}>
      {/* Wrapper div with flex layout to properly position the tooltip */}
      <Tooltip triggerEvent="hover">
        <TooltipTrigger asChild>
          <div>
            <Badge icon variant={variant}>
              <span>{version}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>{getTooltipText()}</TooltipContent>
      </Tooltip>
    </div>
  )
}
