import React from "react"
import { DataGridRow, DataGridCell, ButtonRow, Icon, Modal } from "@cloudoperators/juno-ui-components"
import { Link } from "react-router-dom"
import ExpireDate from "./ExpireDate"

const Item = ({ item, index, handleDelete }) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const close = () => {
    setConfirmDelete(false)
  }

  return (
    <>
      <DataGridRow key={index}>
        <DataGridCell>{!item.name ? "-" : <Link to={`/${item.id}/show`}>{item.name}</Link>}</DataGridCell>
        <DataGridCell>{!item.id ? "-" : item.id}</DataGridCell>
        <DataGridCell>{!item.description ? "-" : item.description}</DataGridCell>
        <DataGridCell>
          <ExpireDate item={item} />
        </DataGridCell>
        <DataGridCell>
          <ButtonRow>
            <Icon icon="deleteForever" onClick={() => setConfirmDelete(true)} />
          </ButtonRow>
        </DataGridCell>
      </DataGridRow>

      <Modal
        title="Warning"
        open={confirmDelete}
        cancelButtonLabel="Cancel"
        confirmButtonLabel="Delete"
        confirmButtonIcon="danger"
        onCancel={close}
        onConfirm={handleDelete}
      >
        <p>
          Are you sure you want to delete application credential <strong>{item.name}</strong>?
        </p>
      </Modal>
    </>
  )
}

export default Item
