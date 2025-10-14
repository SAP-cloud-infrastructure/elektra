import React, { useState } from "react"
import { Badge, Stack, Grid, GridRow, GridColumn, Icon } from "@cloudoperators/juno-ui-components"
import { ReadinessCondition } from "../types/cluster"

const CONDITION_VARIANTS = {
  True: "success",
  False: "error",
  Unknown: "warning",
} as const

type ConditionVariant = (typeof CONDITION_VARIANTS)[keyof typeof CONDITION_VARIANTS]

const getReadinessConditionVariant = (status: string): ConditionVariant =>
  CONDITION_VARIANTS[status as keyof typeof CONDITION_VARIANTS] ?? CONDITION_VARIANTS.Unknown

type BoxProps = React.PropsWithChildren<{
  variant?: ConditionVariant
  children?: React.ReactNode
  className?: string
}>

const Box: React.FC<BoxProps> = ({ variant = "warning", className = "", children, ...props }) => {
  return (
    <div
      className={`tw-bg-theme-${variant} tw-bg-opacity-25 tw-border tw-border-theme-${variant} tw-rounded tw-p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const ConditionBadge: React.FC<{ condition: ReadinessCondition }> = ({ condition }) => {
  const variant = getReadinessConditionVariant(condition.status)
  return <Badge text={condition.displayValue} icon={variant !== "success"} variant={variant} data-variant={variant} />
}

type ReadinessConditionsProps = {
  conditions: ReadinessCondition[]
  showDetails?: boolean
  [key: string]: unknown
}

const ReadinessConditions: React.FC<ReadinessConditionsProps> = ({ conditions, showDetails = false, ...props }) => {
  const [showAll, setShowAll] = useState(false)
  const hasHealthy = conditions.some((c) => c.status === "True")
  const filteredConditions = showAll ? conditions : conditions.filter((c) => c.status !== "True")

  return (
    <Stack direction="vertical" gap="1">
      <Stack gap="2">
        <Stack gap="1" {...props}>
          {conditions.map((condition) => (
            <ConditionBadge key={condition.type} condition={condition} />
          ))}
        </Stack>
        {showDetails && hasHealthy && (
          <div onClick={() => setShowAll((prev) => !prev)} data-testid="toggle-readiness-details">
            <Stack gap="1" className="tw-cursor-pointer tw-text-theme-link hover:tw-underline" direction="horizontal">
              {showAll ? "Hide full readiness details" : "Show full readiness details"}
              <Icon color="global-text" icon={showAll ? "expandLess" : "expandMore"} />
            </Stack>
          </div>
        )}
      </Stack>
      {showDetails && (
        <Stack direction="vertical" gap="2" className="tw-mt-2">
          {filteredConditions.map((condition) => {
            const variant = getReadinessConditionVariant(condition.status)
            return (
              <Box key={condition.type} variant={variant} data-testid={`condition-box`}>
                <ConditionBadge key={condition.type} condition={condition} />

                <Grid>
                  <GridRow>
                    <GridColumn
                      cols={4}
                      className="tw-text-right tw-break-words tw-whitespace-normal tw-overflow-hidden"
                    >
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
                    <GridColumn cols={8}>{condition.lastUpdateTime}</GridColumn>
                  </GridRow>
                </Grid>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}

export default ReadinessConditions
