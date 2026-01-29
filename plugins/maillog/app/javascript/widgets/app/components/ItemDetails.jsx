import React, { useState } from "react";
import {
  DataGridCell,
  DataGridRow,
  Icon,
  JsonViewer,
} from "@cloudoperators/juno-ui-components";
import moment from "moment";
import CopyableText from "./CopyableText";

const ItemDetails = ({ data, children, className, ...props }) => {
  const BlockStyle = { display: "flex", flexDirection: "column" };
  const RowStyle = { display: "flex", flexDirection: "row" };
  const [showJson, setShowJson] = useState(false);

  const toggleDetails = () => {
    setShowJson(!showJson);
  };

  let attempts = null;

  if (data?.attempts) {
    const d = data.attempts[0];
    const codeDataBlock =
      !d?.dialog?.data || d.dialog.data.length === 0
        ? d.dialog.mailFrom
        : d.dialog.data;

    const code = codeDataBlock.response?.code
      ? codeDataBlock.response?.code
      : "";
    const msg = codeDataBlock.response?.msg ? codeDataBlock.response?.msg : "";

    attempts = (
      <div style={{ ...BlockStyle, marginLeft: "15px" }}>
        <span>
          <b>Date:</b> {moment(d.date).format("YYYY-MM-DD, HH:mm:ss")}
        </span>
        <span>
          <b>Hostname Relay:</b>
          <CopyableText text={d.hostname}>{d.hostname}</CopyableText>
        </span>
        <span>
          <b>Response Code:</b> <CopyableText text={code}>{code}</CopyableText>
        </span>
        <span>
          <b>Message:</b> <CopyableText text={msg}>{msg}</CopyableText>
        </span>
      </div>
    );
  }

  const recipientsTable = () => {
    const recipients = data.rcpts.map((r, i) => {
      return (
        <tr key={i}>
          <td style={{ padding: "8px" }}>{r.rcpt}</td>
          <td style={{ padding: "8px" }}>{r.relay}</td>
          <td style={{ padding: "8px" }}>{r.response?.code}</td>
          <td style={{ padding: "8px" }}>{r.response?.ext}</td>
          <td style={{ padding: "8px" }}>{r.response?.msg}</td>
        </tr>
      );
    });

    return (
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                borderBottom: "2px solid #ddd",
              }}
            >
              Recipient
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                borderBottom: "2px solid #ddd",
              }}
            >
              Relay
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                borderBottom: "2px solid #ddd",
              }}
            >
              Response Code
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                borderBottom: "2px solid #ddd",
              }}
            >
              Ext
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                borderBottom: "2px solid #ddd",
              }}
            >
              Message
            </th>
          </tr>
        </thead>
        <tbody>{recipients}</tbody>
      </table>
    );
  };

  const summary = Object.entries(data.summary).map(([key, value]) => {
    if (value != 0) {
      return (
        <span key={key} style={{ marginLeft: "15px" }}>
          {key}
        </span>
      );
    }
  });

  return (
    <DataGridRow>
      <DataGridCell colSpan={6}>
        <div style={BlockStyle}>
          <span>
            <b>Envelope From:</b>
            <CopyableText text={data.from}>{data.from}</CopyableText>
          </span>

          <span>
            <b>Header From:</b>
            <CopyableText text={data.headerFrom}>
              {data.headerFrom}
            </CopyableText>
          </span>

          <span>
            <b>Message ID:</b>
            <CopyableText text={data.messageId}>{data.messageId}</CopyableText>
          </span>

          <span>
            <b>Request ID:</b>
            <CopyableText text={data.id}>{data.id}</CopyableText>
          </span>

          <br />

          {attempts && (
            <span>
              <b>Attempts:</b>
              {attempts}
            </span>
          )}
          <br />

          <span style={BlockStyle}>
            <b>Summary:</b>
            {summary}
          </span>
          <br />

          <span>{recipientsTable()}</span>

          <br />
        </div>
        <div>
          <a
            href="#"
            style={RowStyle}
            onClick={(e) => {
              e.preventDefault();
              toggleDetails(data);
            }}
          >
            <Icon icon={showJson ? "expandLess" : "expandMore"}></Icon>
            {showJson ? "Hide JSON" : "Show JSON"}
          </a>
          <br />

          {showJson && <JsonViewer data={data} expanded />}
        </div>
      </DataGridCell>
    </DataGridRow>
  );
};

export default ItemDetails;
