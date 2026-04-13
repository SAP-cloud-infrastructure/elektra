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
 * @param versionUpdates - Object containing available updates grouped by type, null if couldn't check
 * @param tooltipText - Optional custom tooltip text
 * @param isLoading - Whether update information is still loading
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  versionUpdates,
  tooltipText,
  isLoading = false,
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

  // Determine content and tooltip based on versionUpdates state
  let content: React.ReactNode
  let tooltip: string

  if (versionUpdates === null || versionUpdates === undefined) {
    // Couldn't fetch cloud profiles
    content = <span>{version}</span>
    tooltip = "Unable to check for updates"
  } else {
    // Successfully fetched cloud profiles
    const hasPatchAvailable = !!versionUpdates.patch?.length
    const hasUpgradeAvailable = !!versionUpdates.minor?.length
    const hasMajorAvailable = !!versionUpdates.major?.length
    const hasUpdates = hasPatchAvailable || hasUpgradeAvailable || hasMajorAvailable

    // Determine badge variant based on update availability
    const variant = hasUpdates ? "info" : "success"

    content = (
      <Badge icon variant={variant}>
        <span>{version}</span>
      </Badge>
    )

    // Determine tooltip text with priority: custom > patch > minor > major > no updates
    if (tooltipText) {
      tooltip = tooltipText
    } else if (hasPatchAvailable) {
      tooltip = "Kubernetes patch available"
    } else if (hasUpgradeAvailable) {
      tooltip = "Kubernetes upgrade available"
    } else if (hasMajorAvailable) {
      tooltip = "Updates available"
    } else {
      tooltip = "No updates available"
    }
  }

  return (
    <div className={`tw-flex ${className || ""}`} {...props}>
      <Tooltip triggerEvent="hover">
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  )
}
