import React from "react"
import { ModalFooter, ButtonRow, Button } from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"

const defaultmodalfooterstyles = `
	tw-justify-end
	tw-gap-3.5
`

const Actions = () => {
  const { currentStep, handleSetCurrentStep, steps } = useWizard()

  const isSubmitting = false
  return (
    <ModalFooter className={defaultmodalfooterstyles}>
      <ButtonRow>
        <Button
          onClick={() => handleSetCurrentStep(Math.max(currentStep - 1, 0))}
          disabled={currentStep === 0}
          variant="default"
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => handleSetCurrentStep(Math.min(currentStep + 1, steps.length - 1))} variant="primary">
            Next
          </Button>
        ) : (
          <Button onClick={() => {}} disabled={isSubmitting} variant="primary">
            {isSubmitting ? <span>Creating...</span> : <span>Create Cluster</span>}
          </Button>
        )}
      </ButtonRow>
    </ModalFooter>
  )
}

export default Actions
