import React from "react"
import { useWizard } from "./WizzardProvider"
import BasicInfoStep from "./BasicInfoStep"
import WorkerGroupsStep from "./WorkerGroupsStep"
import Progress from "./Progress"
import Summary from "./Summary"

const CreateClusterDialogContent = () => {
  const { currentStep } = useWizard()

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />
      case 1:
        return <WorkerGroupsStep />
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
