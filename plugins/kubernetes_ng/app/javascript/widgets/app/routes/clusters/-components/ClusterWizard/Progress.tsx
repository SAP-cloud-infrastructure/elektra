import React from "react"
import { Grid, GridRow, GridColumn, Container, Stack } from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"

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

const Progress = () => {
  const { handleSetCurrentStep, maxStepReached, steps } = useWizard()
  const stepCols = Math.floor(12 / steps.length)

  return (
    <Container px={false} py>
      <Grid>
        <GridRow>
          {steps.map((step, index) => (
            <GridColumn key={index} cols={stepCols} className="tw-text-center">
              <button
                type="button"
                className={index > maxStepReached ? disabledStepStyle : enabledStepStyle}
                disabled={index > maxStepReached}
                onClick={() => handleSetCurrentStep(index)}
                aria-disabled={index > maxStepReached}
                aria-label={`Go to step ${index + 1}: ${step.title}${index > maxStepReached ? " (not available yet)" : ""}`}
              >
                <Stack alignment="center" gap="2">
                  <span className={dotStyle} />
                  <b className={step.hasError ? "tw-text-theme-danger" : ""}>{step.title}</b>
                </Stack>
              </button>
            </GridColumn>
          ))}
        </GridRow>
      </Grid>
    </Container>
  )
}

export default Progress
