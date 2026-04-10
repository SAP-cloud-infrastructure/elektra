import React from "react"
import { Badge, Tooltip, TooltipTrigger, TooltipContent, Spinner } from "@cloudoperators/juno-ui-components"

export interface VersionBadgeProps {
  version: string
  hasPatchAvailable?: boolean
  hasUpgradeAvailable?: boolean
  tooltipText?: string
  isLoading?: boolean
  hasError?: boolean
}

/**
 * VersionBadge component displays a Kubernetes version with optional update indicators
 *
 * Based on Gardener Dashboard's GShootVersionChip component behavior:
 * - Shows version number as badge text
 * - Displays update icon (↑) when patches or upgrades are available
 * - Tooltip shows update status (patch takes precedence over upgrade)
 * - Badge variant changes based on update availability
 *
 * @param version - The Kubernetes version string (e.g., "1.27.5")
 * @param hasPatchAvailable - Whether patch updates are available
 * @param hasUpgradeAvailable - Whether minor upgrades are available
 * @param tooltipText - Optional custom tooltip text
 * @param isLoading - Whether update information is still loading
 * @param hasError - Whether there was an error fetching update information
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  hasPatchAvailable = false,
  hasUpgradeAvailable = false,
  tooltipText,
  isLoading = false,
  hasError = false,
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

  const hasUpdates = hasPatchAvailable || hasUpgradeAvailable

  // Determine tooltip text with priority: custom > patch > upgrade > default
  const getTooltipText = (): string => {
    if (tooltipText) return tooltipText
    if (hasPatchAvailable) return "Kubernetes patch available"
    if (hasUpgradeAvailable) return "Kubernetes upgrade available"
    return "No updates available"
  }

  // Determine badge variant based on update availability
  const variant = hasUpdates ? "info" : "success"

  // Always wrap with tooltip to show status
  return (
    <div className="tw-flex">
      {/* Wrapper div with flex layout to properly position the tooltip */}
      <Tooltip triggerEvent="hover">
        <TooltipTrigger asChild>
          <div>
            <Badge icon variant={variant} {...props}>
              <span>{version}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>{getTooltipText()}</TooltipContent>
      </Tooltip>
    </div>
  )
}
