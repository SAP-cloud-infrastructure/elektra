import React, { useState } from "react"
import { Badge, Stack, Grid, GridRow, GridColumn, Icon } from "@cloudoperators/juno-ui-components"
import { ReadinessCondition } from "../types/cluster"
import Box from "./Box"
import Collapse from "./Collapse"

const CONDITION_VARIANTS = {
  True: "success",
  False: "error",
  Unknown: "warning",
} as const

type ConditionVariant = (typeof CONDITION_VARIANTS)[keyof typeof CONDITION_VARIANTS]

const getReadinessConditionVariant = (status: string): ConditionVariant =>
  CONDITION_VARIANTS[status as keyof typeof CONDITION_VARIANTS] ?? CONDITION_VARIANTS.Unknown

const ConditionBadge: React.FC<{ condition: ReadinessCondition }> = ({ condition }) => {
  const variant = getReadinessConditionVariant(condition.status)
  return <Badge text={condition.displayValue} icon={variant !== "success"} variant={variant} data-variant={variant} />
}

const renderCondition = (condition: ReadinessCondition) => {
  const variant = getReadinessConditionVariant(condition.status)
  return (
    <Box key={condition.type} variant={variant}>
      <ConditionBadge condition={condition} />
      <Grid>
        <GridRow>
          <GridColumn cols={4} className="tw-text-right tw-break-words tw-whitespace-normal tw-overflow-hidden">
            <strong>{condition.type}</strong>
          </GridColumn>
          <GridColumn cols={8}>{condition.status === "True" ? "true" : "false"}</GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn cols={4} className="tw-text-right">
            <strong>Last message</strong>
          </GridColumn>
          <GridColumn cols={8}>{condition.message}</GridColumn>
        </GridRow>
        <GridRow>
          <GridColumn cols={4} className="tw-text-right">
            <strong>Last status change</strong>
          </GridColumn>
          <GridColumn cols={8}>{new Date(condition.lastUpdateTime || "").toLocaleString()}</GridColumn>
        </GridRow>
      </Grid>
    </Box>
  )
}

type ReadinessConditionsProps = {
  conditions: ReadinessCondition[]
  showDetails?: boolean
}

/**
 * A component that displays Kubernetes readiness conditions as badges with optional detailed view.
 *
 * @component
 * @description
 * Renders a list of readiness conditions with visual indicators (badges) showing their status.
 * Supports two display modes:
 * - Compact mode: Shows all condition badges in a horizontal stack
 * - Detailed mode: Shows expandable details with condition type, status, message, and last update time
 *
 * The component automatically filters conditions when details are shown, hiding successful conditions
 * by default with an option to show all conditions via a toggle button.
 *
 * @param {ReadinessConditionsProps} props - Component props
 * @param {ReadinessCondition[]} props.conditions - Array of readiness conditions to display
 * @param {boolean} [props.showDetails=false] - Whether to show the detailed expandable view
 */
const ReadinessConditions: React.FC<ReadinessConditionsProps> = ({ conditions, showDetails = false, ...props }) => {
  const [showAll, setShowAll] = useState(false)

  // split conditions into healthy and unhealthy
  const healthyConditions = conditions.filter((c) => c.status === "True")
  const unhealthyConditions = conditions.filter((c) => c.status !== "True")

  return (
    <div {...props}>
      <Stack gap="2">
        <Stack gap="1">
          {conditions.map((condition) => (
            <ConditionBadge key={condition.type} condition={condition} />
          ))}
        </Stack>
        {showDetails && healthyConditions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
            aria-expanded={showAll}
            aria-controls="readiness-details"
            id="readiness-toggle"
          >
            {showAll ? "Hide full readiness details" : "Show full readiness details"}
            <Icon color="global-text" icon={showAll ? "expandLess" : "expandMore"} />
          </button>
        )}
      </Stack>
      {showDetails && (
        <>
          {unhealthyConditions.length > 0 && (
            <Stack direction="vertical" gap="2" className="tw-mt-2">
              {unhealthyConditions.map(renderCondition)}
            </Stack>
          )}
          {healthyConditions.length > 0 && (
            <Collapse isOpen={showAll} id="readiness-details" aria-labelledby="readiness-toggle">
              <Stack direction="vertical" gap="2" className="tw-mt-2">
                {healthyConditions.map(renderCondition)}
              </Stack>
            </Collapse>
          )}
        </>
      )}
    </div>
  )
}

export default ReadinessConditions
