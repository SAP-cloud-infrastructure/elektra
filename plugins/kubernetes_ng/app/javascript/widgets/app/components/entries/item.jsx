import React from "react"
import { Link, useHistory } from "react-router-dom"
import { policy } from "lib/policy"
import {
  Badge,
  ButtonRow,
  Icon,
  DataGridRow,
  DataGridCell,
} from "@cloudoperators/juno-ui-components"

const Item = ({ entry, handleDelete }) => {
  // manually push a path onto the react router history
  // once we run on react-router-dom v6 this should be replaced with the useNavigate hook, and the push function with a navigate function
  // like this: const navigate = useNavigate(), the use navigate('this/is/the/path') in the onClick handler of the edit button below
  const { push } = useHistory()

  return (
    <DataGridRow className={entry.isDeleting ? "updating" : ""}>
      <DataGridCell>
        <Link to={`/entries/${entry.id}/show`}>{entry.name || entry.id}</Link>
        <br />
        <Badge>{entry.id}</Badge>
      </DataGridCell>
      <DataGridCell>{entry.description}</DataGridCell>
      <DataGridCell nowrap>
        <ButtonRow>
          {policy.isAllowed("kubernetes_ng:entry_delete") && (
            <Icon icon="deleteForever" onClick={() => handleDelete(entry.id)} />
          )}
          {policy.isAllowed("kubernetes_ng:entry_update") && (
            <Icon
              icon="edit"
              onClick={() => push(`/entries/${entry.id}/edit`)}
            />
          )}
        </ButtonRow>
      </DataGridCell>
    </DataGridRow>
  )
}

export default Item
