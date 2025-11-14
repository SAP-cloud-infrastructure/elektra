import React from "react"
import { Modal } from "@cloudoperators/juno-ui-components/index"
import CreateClusterDialogContent from "./ClusterWizard/CreateClusterDialogContent"
import { GardenerApi } from "../../../apiClient"
import { WizardProvider } from "./ClusterWizard/WizzardProvider"
import Actions from "./ClusterWizard/Actions"

interface CreateClusterWizardProps {
  isOpen: boolean
  onClose: () => void
  client: GardenerApi
}

const CreateClusterWizard: React.FC<CreateClusterWizardProps> = ({ isOpen, onClose, client }) => {
  return (
    <WizardProvider cloudProfilesPromise={client.gardener.getCloudProfiles()}>
      <Modal
        className="tw-w-[76.75rem]"
        open={isOpen}
        onCancel={onClose}
        size="large"
        aria-modal={true}
        title="Create Cluster"
        modalFooter={<Actions />}
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
