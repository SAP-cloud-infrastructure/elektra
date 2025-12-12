import React from "react"
import { ModalFooter, ButtonRow, Button } from "@cloudoperators/juno-ui-components"
import { useWizard } from "./WizzardProvider"

const Actions = ({ onSuccessCreate }: { onSuccessCreate: (clusterName: string) => void }) => {
  const { currentStep, handleSetCurrentStep, steps, createMutation, clusterFormData, cloudProfiles, extNetworks } =
    useWizard()

  //check if hasError is false for all steps
  const isFormValid = steps.every((step) => !step.hasError)

  // next button disabled if cloud profiles or external networks are loading or fetching
  const isNextDisabled =
    cloudProfiles.isLoading || cloudProfiles.isFetching || extNetworks.isLoading || extNetworks.isFetching

  const onSubmit = () => {
    return createMutation.mutate(clusterFormData, {
      onSuccess: (cluster) => {
        onSuccessCreate(cluster.name)
      },
    })
  }

  return (
    <ModalFooter className="tw-justify-end tw-items-center">
      <ButtonRow>
        <Button
          onClick={() => handleSetCurrentStep(Math.max(currentStep - 1, 0))}
          disabled={currentStep === 0}
          variant="default"
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => handleSetCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
            variant="primary"
            disabled={isNextDisabled}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={!isFormValid || createMutation.isPending}
            progress={createMutation.isPending}
            variant="primary"
          >
            {createMutation.isPending ? <span>Creating...</span> : <span>Create Cluster</span>}
          </Button>
        )}
      </ButtonRow>
    </ModalFooter>
  )
}

export default Actions
