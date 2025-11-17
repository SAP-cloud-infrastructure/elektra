import React from "react"
import { useWizard } from "./WizzardProvider"
import BasicInfoStep from "./BasicInfoStep"
import Progress from "./Progress"
import Summary from "./Summary"

const CreateClusterDialogContent = () => {
  const { currentStep } = useWizard()

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />
      case 1:
        return <div>Step 2 Content</div>
      case 2:
        return <Summary />
      default:
        return null
    }
  }

  return (
    <>
      <Progress />
      {renderStepContent()}
    </>
  )
}

export default CreateClusterDialogContent
