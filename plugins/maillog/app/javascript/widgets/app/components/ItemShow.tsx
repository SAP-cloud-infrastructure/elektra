import React from "react"
import {
  Panel,
  PanelBody,
  Stack,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  JsonViewer,
  Icon,
} from "@cloudoperators/juno-ui-components"
import { useParams, useHistory, useLocation } from "react-router-dom"
import moment from "moment"
import { MailLogEntry } from "../actions"

interface ItemShowProps {
  data: MailLogEntry[]
}

const ItemShow: React.FC<ItemShowProps> = ({ data }) => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const history = useHistory()
  const [showJson, setShowJson] = React.useState(false)

  // Find the item by id
  const item = data.find((entry) => entry.id === id)

  const close = () => {
    history.replace(location.pathname.replace(/\/[^/]+\/show$/, ""))
  }

  const toggleJson = () => {
    setShowJson(!showJson)
  }

  if (!item) {
    return (
      <Panel opened={true} onClose={close} heading="Mail Log Details">
        <PanelBody>
          <Stack direction="vertical" gap="3">
            <p>Item not found</p>
          </Stack>
        </PanelBody>
      </Panel>
    )
  }

  const BlockStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" }
  const RowStyle: React.CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem" }

  let attempts: React.ReactNode = null

  if (item?.attempts && item.attempts.length > 0) {
    const d = item.attempts[0]
    const codeDataBlock =
      !d?.dialog?.data || (Array.isArray(d.dialog.data) && d.dialog.data.length === 0)
        ? d.dialog.mailFrom
        : d.dialog.data

    const code = codeDataBlock?.response?.code ? codeDataBlock.response.code : ""
    const msg = codeDataBlock?.response?.msg ? codeDataBlock.response.msg : ""

    attempts = (
      <div style={{ ...BlockStyle, marginLeft: "15px" }}>
        <span>
          <b>Date:</b> {moment(d.date).format("YYYY-MM-DD, HH:mm:ss") || "-"}
        </span>
        <span>
          <b>Hostname Relay:</b>
          {d.hostname || "-"}
        </span>
        <span>
          <b>Response Code:</b> {code || "-"}
        </span>
        <span>
          <b>Message:</b> {msg || "-"}
        </span>
      </div>
    )
  }

  const recipientsTable = () => {
    const recipients = item.rcpts.map((r, i) => {
      return (
        <DataGridRow key={i}>
          <DataGridCell>{r.rcpt}</DataGridCell>
          <DataGridCell>{r.relay}</DataGridCell>
          <DataGridCell>{r.response?.code}</DataGridCell>
          <DataGridCell>{r.response?.ext}</DataGridCell>
          <DataGridCell>{r.response?.msg}</DataGridCell>
        </DataGridRow>
      )
    })

    return (
      <DataGrid columns={5}>
        <DataGridRow>
          <DataGridHeadCell>Recipient</DataGridHeadCell>
          <DataGridHeadCell>Relay</DataGridHeadCell>
          <DataGridHeadCell>Response Code</DataGridHeadCell>
          <DataGridHeadCell>Ext</DataGridHeadCell>
          <DataGridHeadCell>Message</DataGridHeadCell>
        </DataGridRow>
        {recipients}
      </DataGrid>
    )
  }

  const summary = Object.entries(item.summary)
    .map(([key, value]) => {
      if (value != 0) {
        return key
      }
      return null
    })
    .filter((item) => item !== null)

  return (
    <Panel opened={true} onClose={close} heading="Mail Log Details">
      <PanelBody>
        <Stack direction="vertical" gap="3">
          <DataGrid columns={2}>
            <DataGridRow>
              <DataGridHeadCell>Time</DataGridHeadCell>
              <DataGridCell>
                {moment(item.date).format("YYYY-MM-DD, HH:mm:ss")}
                <p style={{ fontSize: "0.8rem" }}>UTC: {moment(item.date).utc().format("YYYY-MM-DD, HH:mm:ss")}</p>
              </DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Envelope From</DataGridHeadCell>
              <DataGridCell className="tw-break-all">{item.from || "-"}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Header From</DataGridHeadCell>
              <DataGridCell className="tw-break-all">{item.headerFrom || "-"}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Subject</DataGridHeadCell>
              <DataGridCell className="tw-break-all">{item.subject || "-"}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Message ID</DataGridHeadCell>
              <DataGridCell className="tw-break-all">{item.messageId || "-"}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Request ID</DataGridHeadCell>
              <DataGridCell className="tw-break-all">{item.id || "-"}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Attempts</DataGridHeadCell>
              <DataGridCell>{attempts || "-"}</DataGridCell>
            </DataGridRow>
            <DataGridRow>
              <DataGridHeadCell>Summary</DataGridHeadCell>
              <DataGridCell>{summary || "-"}</DataGridCell>
            </DataGridRow>
          </DataGrid>

          <hr style={{ border: "1px solid #ddd" }} />
          {recipientsTable()}
          <hr style={{ border: "1px solid #ddd" }} />

          <div style={BlockStyle}>
            <a
              href="#"
              style={RowStyle}
              onClick={(e) => {
                e.preventDefault()
                toggleJson()
              }}
            >
              <Icon icon={showJson ? "expandLess" : "expandMore"}></Icon>
              {showJson ? "Hide JSON" : "Show JSON"}
            </a>

            {showJson && <JsonViewer data={item} expanded />}
          </div>
        </Stack>
      </PanelBody>
    </Panel>
  )
}

export default ItemShow
