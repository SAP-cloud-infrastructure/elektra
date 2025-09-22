import React from "react"
import { Badge, Stack } from "@cloudoperators/juno-ui-components"

const getReadinessConditionStyles = (status: string) => {
  // TODO add intermediate conditions as Processing, Degraded etc.
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

type RedinessConditionsProps = {
  conditions: Condition[]
  [key: string]: any
}

const RedinessConditions: React.FC<RedinessConditionsProps> = ({ conditions, ...props }) => {
  return (
    <Stack gap="1" {...props}>
      {conditions.map((condition) => {
        const conditionStyles = getReadinessConditionStyles(condition.status)
        return (
          <Badge
            key={condition.type}
            text={condition.displayValue}
            icon
            variant={conditionStyles.variant}
            data-variant={conditionStyles.variant}
          />
        )
      })}
    </Stack>
  )
}

export default RedinessConditions
