import React from "react"
import { Modal, Message, Container, ModalFooter, ButtonRow, Button } from "@cloudoperators/juno-ui-components"

interface KubeconfigDownloadDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDownloading?: boolean
}

const KubeconfigDownloadDialog: React.FC<KubeconfigDownloadDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDownloading = false,
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="Download Garden Kubeconfig"
      modalFooter={
        <ModalFooter className="tw-justify-end tw-items-center">
          <ButtonRow>
            <Button onClick={onClose} variant="default">
              Cancel
            </Button>
            <Button onClick={onConfirm} variant="primary" disabled={isDownloading} progress={isDownloading}>
              Download
            </Button>
          </ButtonRow>
        </ModalFooter>
      }
    >
      <Container px={false} py>
        <Message variant="info">
          The token used in the kubeconfig is valid as long as your dashboard session is active.
        </Message>
      </Container>
      <p className="tw-mb-4">This kubeconfig provides access to the Garden API server for managing your clusters.</p>
      <p className="tw-mb-4">
        <strong>Important:</strong> The authentication token embedded in this kubeconfig is tied to your current
        dashboard session. When your session expires, you will need to download a new kubeconfig.
      </p>
    </Modal>
  )
}

export default KubeconfigDownloadDialog
