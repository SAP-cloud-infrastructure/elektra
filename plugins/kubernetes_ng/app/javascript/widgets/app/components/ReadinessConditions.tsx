import React from "react"
import { Badge, Stack } from "@cloudoperators/juno-ui-components"

const getReadinessConditionStyles = (status: string) => {
  switch (status) {
    case "True":
      return {
        variant: "success" as const,
      }
    case "False":
      return {
        variant: "error" as const,
      }
    default:
      return {
        variant: "warning" as const,
      }
  }
}

type Condition = {
  type: string
  status: string
  displayValue: string
}

type ReadinessConditionsProps = {
  conditions: Condition[]
  [key: string]: unknown
}

const ReadinessConditions: React.FC<ReadinessConditionsProps> = ({ conditions, ...props }) => {
  return (
    <Stack gap="1" {...props}>
      {conditions.map((condition) => {
        const conditionStyles = getReadinessConditionStyles(condition.status)
        return (
          <Badge
            key={condition.type}
            text={condition.displayValue}
            icon={conditionStyles.variant !== "success"}
            variant={conditionStyles.variant}
            data-variant={conditionStyles.variant}
          />
        )
      })}
    </Stack>
  )
}

export default ReadinessConditions
