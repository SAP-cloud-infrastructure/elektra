import React from "react"
// import { Modal, Button } from "react-bootstrap"
import { useHistory, useLocation, useParams } from "react-router-dom"
import { useGlobalState } from "../StateProvider"

import {
  Panel,
  PanelBody,
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
} from "@cloudoperators/juno-ui-components"

const Row = ({ label, value, children }) => {
  return (
    <DataGridRow>
      <DataGridHeadCell>{label}</DataGridHeadCell>
      <DataGridCell>{value || children}</DataGridCell>
    </DataGridRow>
  )
}

const Show = () => {
  const location = useLocation()
  const history = useHistory()
  const params = useParams()
  const [state] = useGlobalState()
  const entry = React.useMemo(
    () => state.entries.items.find((i) => i.id === params.id),
    [state.entries, params.id]
  )
  const [show, setShow] = React.useState(!!entry)
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true
    setShow(!!params.id)
    return () => (mounted.current = false)
  }, [params.id])

  const restoreURL = React.useCallback(() => {
    history.replace(
      location.pathname.replace(/^(\/[^/]*)\/.+\/show$/, (a, b) => b)
    )
  }, [history, location])

  const close = React.useCallback(() => {
    setShow(false)
    restoreURL()
  }, [restoreURL])

  return (
    <Panel
      opened={show}
      onClose={close}
      heading={`Entry ${entry ? entry.name : ""}`}
    >
      <PanelBody>
        {entry ? (
          <DataGrid columns={2}>
            <Row label="Name" value={entry.name} />
            <Row label="Description" value={entry.description} />
            <Row label="ID" value={entry.id} />
          </DataGrid>
        ) : (
          <span>Entry {params.id} not found</span>
        )}
      </PanelBody>
    </Panel>
  )
}

export default Show
