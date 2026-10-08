import React from "react"
import { Spinner } from "@cloudoperators/juno-ui-components"
import { useRouteContext } from "@tanstack/react-router"
import { useGardenerInfoQuery } from "../hooks/useGardenerInfo"
import { RouterContext } from "../routes/__root"
import { normalizeError } from "./InlineError"

const GardenerVersion: React.FC = () => {
  const { apiClient } = (useRouteContext({ strict: false }) as RouterContext) || {}
  const { data: gardenerInfo, isLoading, error } = useGardenerInfoQuery(apiClient)

  if (isLoading) {
    return (
      <span className="tw-text-sm tw-flex tw-items-center tw-gap-2">
        <span>Gardener Version:</span>
        <Spinner size="small" variant="primary" />
      </span>
    )
  }

  if (error) {
    const errorDetails = normalizeError(error)
    return <span className="tw-text-sm">Gardener Version: {errorDetails.title} {errorDetails.message}</span>
  }

  if (gardenerInfo === null || !gardenerInfo?.version) {
    return <span className="tw-text-sm">Gardener Version: Not available</span>
  }

  return <span className="tw-text-sm">Gardener Version: {gardenerInfo.version}</span>
}

export default GardenerVersion
