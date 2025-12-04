import React from "react"
import { Modal } from "@cloudoperators/juno-ui-components/index"
import CreateClusterDialogContent from "./ClusterWizard/CreateClusterDialogContent"
import { GardenerApi } from "../../../apiClient"
import { WizardProvider } from "./ClusterWizard/WizzardProvider"
import Actions from "./ClusterWizard/Actions"
import { DEFAULT_CLUSTER_FORM_DATA } from "./ClusterWizard/defaults"

interface CreateClusterWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccessCreate: (clusterName: string) => void
  client: GardenerApi
  region: string
}

const CreateClusterWizard = ({ isOpen, onClose, client, region, onSuccessCreate }: CreateClusterWizardProps) => {
  return (
    <WizardProvider client={client} region={region} formData={DEFAULT_CLUSTER_FORM_DATA}>
      <Modal
        className="tw-w-[76.75rem]"
        open={isOpen}
        onCancel={onClose}
        size="large"
        aria-modal={true}
        title="Create Cluster"
        modalFooter={
          <Actions
            onSuccessCreate={(clusterName) => {
              onSuccessCreate(clusterName)
              onClose()
            }}
          />
        }
        onConfirm={() => {
          onClose()
        }}
      >
        <CreateClusterDialogContent />
      </Modal>
    </WizardProvider>
  )
}

export default CreateClusterWizard
