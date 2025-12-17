import React, { useState } from "react"
import {
  Modal,
  Message,
  Container,
  FormRow,
  TextInput,
  ModalFooter,
  ButtonRow,
  Button,
} from "@cloudoperators/juno-ui-components"

const FooterActions = ({
  onConfirm,
  onCancel,
  confirmDisabled = true,
}: {
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled?: boolean
}) => {
  return (
    <ModalFooter className="tw-justify-end tw-items-center">
      <ButtonRow>
        <Button onClick={onCancel} variant="default">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="primary-danger" disabled={confirmDisabled}>
          Confirm Deletion
        </Button>
      </ButtonRow>
    </ModalFooter>
  )
}

interface DeleteDialogProps {
  clusterName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ clusterName, isOpen, onClose, onConfirm, isDeleting = false }) => {
  const [inputName, setInputName] = useState("")
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={`Delete Cluster ${clusterName}`}
      size="large"
      modalFooter={
        <FooterActions
          onCancel={onClose}
          onConfirm={onConfirm}
          confirmDisabled={inputName !== clusterName || isDeleting}
        />
      }
    >
      <Container px={false} py>
        <Message variant="danger">
          Destructive action which cannot be undone. The cluster will be permanently deleted.
        </Message>
      </Container>
      <p className="tw-font-bold tw-mb-4">Do you really want to remove the cluster {clusterName} from your project?</p>
      <p className="tw-mb-4">
        After continuing you project will no longer have access to the cluster <b>{clusterName}</b> resources.
      </p>
      <p className="tw-mb-4">Type in the name of the cluster to delete.</p>
      <FormRow>
        <TextInput
          label="Name"
          id="clusterName"
          required
          type="text"
          onChange={(e) => setInputName(e.target.value)}
          helptext="Name should match the name of the cluster being deleted."
          invalid={inputName !== clusterName}
          valid={inputName === clusterName}
          maxLength={20}
        />
      </FormRow>
    </Modal>
  )
}

export default DeleteDialog
