import React from "react"
import StatusPill from "lib/components/StatusPill"

// Map lbaas2's BS3-era label-* class names to the shared StatusPill
// semantic categories.
const labelClassToCategory = (labelClassName) => {
  switch (labelClassName) {
    case "label-success":
      return "ok"
    case "label-danger":
      return "error"
    case "label-warning":
      return "busy"
    case "label-warning-greyscale":
    case "label-info":
    default:
      return "idle"
  }
}

export const operationStatusOptions = (option) => {
  switch (option) {
    case "ONLINE":
      return {
        labelClassName: "label-success",
        textClassName: "text-success",
        title: (
          <>
            <ul className="label-tooltip">
              <li>Entity is operating normally</li>
              <li>All pool members are healthy</li>
            </ul>
          </>
        ),
      }

    case "DRAINING":
      return {
        labelClassName: "label-warning-greyscale",
        textClassName: "text-warning-greyscale",
        title: "The member is not accepting new connections",
      }
    case "DEGRADED":
      return {
        labelClassName: "label-warning-greyscale",
        textClassName: "text-warning-greyscale",
        title: "One or more of the entity’s components are in ERROR",
      }
    case "OFFLINE":
      return {
        labelClassName: "label-warning-greyscale",
        textClassName: "text-warning-greyscale",
        title: "Entity is administratively disabled",
      }
    case "NO_MONITOR":
      return {
        labelClassName: "label-warning-greyscale",
        textClassName: "text-warning-greyscale",
        title:
          "No health monitor is configured for this entity and it’s status is unknown",
      }

    case "ERROR":
      return {
        labelClassName: "label-warning-greyscale",
        textClassName: "text-warning-greyscale",
        title: (
          <>
            <ul className="label-tooltip">
              <li>The entity has failed</li>
              <li>The member is failing it’s health monitoring checks</li>
              <li>All of the pool members are in ERROR</li>
            </ul>
          </>
        ),
      }
    default:
      return {
        labelClassName: "label-info",
        textClassName: "text-info",
        title: "Unknown state",
      }
  }
}

export const provisioningStatusOptions = (option) => {
  switch (option) {
    case "ACTIVE":
      return {
        labelClassName: "label-success",
        textClassName: "text-success",
        title: "The entity was provisioned successfully",
      }
    case "DELETED":
      return {
        labelClassName: "label-success",
        textClassName: "text-success",
        title: "The entity has been successfully deleted",
      }

    case "ERROR":
      return {
        labelClassName: "label-danger",
        textClassName: "text-danger",
        title: "Provisioning failed",
      }

    case "PENDING_CREATE":
      return {
        labelClassName: "label-warning",
        textClassName: "text-warning",
        title: "The entity is being created",
      }
    case "PENDING_UPDATE":
      return {
        labelClassName: "label-warning",
        textClassName: "text-warning",
        title: "The entity is being updated",
      }
    case "PENDING_DELETE":
      return {
        labelClassName: "label-warning",
        textClassName: "text-warning",
        title: "The entity is being deleted",
      }
    default:
      return {
        labelClassName: "label-info",
        textClassName: "text-info",
        title: "Unknown state",
      }
  }
}

const operatingStatusLable = (label) => {
  if (label == "ERROR") {
    return "OFFLINE"
  }
  return label
}

const useStatus = (operatingStatus, provisioningStatus, options) => {
  const entityStatus = React.useMemo(() => {
    const opStatusOptions = operationStatusOptions(operatingStatus)
    const provStatusOptions = provisioningStatusOptions(provisioningStatus)

    const stateLabelTooltipContent = () => {
      // add extra error options if this option is set. Used in pools section
      if (
        options &&
        options.operatingStatusErrorExtraTitle &&
        operatingStatus === "ERROR"
      ) {
        return (
          <>
            <ul className="label-tooltip extra-title">
              <li>{options.operatingStatusErrorExtraTitle}</li>
            </ul>
            {opStatusOptions.title}
          </>
        )
      }
      return opStatusOptions.title
    }

    return (
      <>
        <StatusPill
          status={operatingStatusLable(operatingStatus)}
          category={labelClassToCategory(opStatusOptions.labelClassName)}
          label={operatingStatusLable(operatingStatus)}
          tooltip={
            <>
              <b>Operating Status</b>
              <br />
              {stateLabelTooltipContent()}
            </>
          }
        />
        {provisioningStatus !== "ACTIVE" && (
          <>
            <br />
            <StatusPill
              status={provisioningStatus}
              category={labelClassToCategory(provStatusOptions.labelClassName)}
              label={provisioningStatus}
              tooltip={
                <>
                  <b>Provisioning Status</b>
                  <br />
                  {provStatusOptions.title}
                </>
              }
            />
          </>
        )}
      </>
    )
  }, [operatingStatus, provisioningStatus])

  return {
    entityStatus,
  }
}

export default useStatus
