import React from "react"
import { useWizard } from "./WizzardProvider"
import Step1 from "./Step1"
import Step2 from "./Step2"
import Progress from "./Progress"
import Summary from "./Summary"

const CreateClusterDialogContent = () => {
  const { currentStep } = useWizard()

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1 />
      case 1:
        return <Step2 />
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
