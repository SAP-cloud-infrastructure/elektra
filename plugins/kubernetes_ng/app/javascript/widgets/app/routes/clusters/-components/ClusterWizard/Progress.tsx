import React from "react"
import { Grid, GridRow, GridColumn, Container, Stack, Icon } from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"
import { Step } from "./types"

const enabledStepStyle = `
tw-cursor-pointer 
tw-text-theme-link 
hover:tw-underline  
tw-bg-transparent 
tw-border-none tw-p-0`

const disabledStepStyle = `
tw-cursor-not-allowed 
tw-text-theme-text-secondary 
tw-bg-transparent 
tw-border-none 
tw-p-0`

const dotStyle = `
tw-bg-current
tw-rounded-full
tw-aspect-square
tw-h-4
tw-flex-shrink-0`

type StepStatus = "error" | "success" | "none"

const StepStatusIcon = ({ status }: { status: StepStatus }) => {
  if (status === "success") return <Icon icon="checkCircle" color="tw-text-theme-success" size="20" />
  if (status === "error") return <Icon icon="cancel" color="tw-text-theme-danger" size="20" />
  return <span className={dotStyle} />
}

const StepTitle = ({ status, title }: { status: StepStatus; title: string }) => {
  const color = status === "error" ? "tw-text-theme-danger" : status === "success" ? "tw-text-theme-default" : ""
  return <b className={color}>{title}</b>
}

export const getStepStatus = ({
  currentStep,
  maxStepReached,
  step,
}: {
  currentStep: number
  maxStepReached: number
  step: Step
}): { isFuture: boolean; status: StepStatus } => {
  const isFuture = step.index > maxStepReached
  // FUTURE STEP ==> not clickable, show no status
  if (isFuture) return { isFuture: true, status: "none" }
  // STEP HAS ERROR ==> show error icon
  if (step.hasError) return { isFuture: false, status: "error" }
  // PAST STEP ==> already completed successfully, includes steps that are before the current step or before the max step reached
  if (step.index < currentStep || step.index < maxStepReached) return { isFuture: false, status: "success" }
  // CURRENT STEP ==> in-progress but not yet completed
  return { isFuture: false, status: "none" }
}

const StepButton = React.memo(
  ({
    step,
    status,
    isFuture,
    onClick,
  }: {
    step: Step
    status: StepStatus
    isFuture: boolean
    onClick: (index: number) => void
  }) => {
    const buttonStyle = isFuture ? disabledStepStyle : enabledStepStyle
    return (
      <button
        type="button"
        className={buttonStyle}
        disabled={isFuture}
        onClick={() => onClick(step.index)}
        aria-current={!isFuture && status === "none" ? "step" : undefined}
        aria-label={step.title}
      >
        <Stack alignment="center" gap="2">
          <StepStatusIcon status={status} />
          <StepTitle status={status} title={step.title} />
        </Stack>
      </button>
    )
  }
)

const Progress = () => {
  const { handleSetCurrentStep, maxStepReached, steps, currentStep } = useWizard()
  const stepCols = Math.max(Math.floor(12 / steps.length), 1)
  // compute min and max for accessibility
  const minStep = Math.min(...steps.map((s) => s.index))
  const maxStep = Math.max(...steps.map((s) => s.index))

  return (
    <Container
      px={false}
      py
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={minStep}
      aria-valuemax={maxStep}
    >
      <Grid>
        <GridRow>
          {steps
            .slice()
            .sort((a, b) => a.index - b.index)
            .map((step) => {
              const { isFuture, status } = getStepStatus({ currentStep, maxStepReached, step })

              return (
                <GridColumn key={step.id} cols={stepCols} className="tw-text-center">
                  <StepButton step={step} status={status} isFuture={isFuture} onClick={handleSetCurrentStep} />
                </GridColumn>
              )
            })}
        </GridRow>
      </Grid>
    </Container>
  )
}

export default Progress
