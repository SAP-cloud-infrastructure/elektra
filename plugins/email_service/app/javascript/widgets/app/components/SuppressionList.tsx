import React, { useState } from "react"
import moment from "moment"

interface SuppressedEntry {
  id: string
  email: string
  reason: string
  originalMessageId: string
  addedAt: Date | null
}

const INITIAL_ROWS: SuppressedEntry[] = [
  { id: "1", email: "bounce-user@example.com", reason: "Hard bounce detected", originalMessageId: "", addedAt: new Date("2026-02-22T16:40:00Z") },
  { id: "2", email: "complaint-user@example.com", reason: "Complaint / user request", originalMessageId: "", addedAt: new Date("2026-02-23T09:25:00Z") },
  { id: "3", email: "invalid-mailbox@example.net", reason: "Mailbox does not exist", originalMessageId: "", addedAt: new Date("2026-02-23T11:02:00Z") },
]

const Th: React.FC<{ children: React.ReactNode; width?: number | string }> = ({ children, width }) => (
  <th
    style={{
      textAlign: "left",
      fontSize: 12,
      fontWeight: 600,
      color: "#9ca3af",
      padding: "10px 16px",
      borderBottom: "1px solid #f3f4f6",
      width,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      background: "transparent",
    }}
  >
    {children}
  </th>
)

const Td: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", borderBottom: "1px solid #f3f4f6", ...style }}>
    {children}
  </td>
)

const EditableCell: React.FC<{
  value: string
  onChange: (v: string) => void
  placeholder?: string
}> = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      border: "1px solid #d1d5db",
      borderRadius: 6,
      padding: "5px 8px",
      fontSize: 13,
      color: "#111827",
      background: "#fff",
      width: "100%",
      outline: "none",
    }}
  />
)

const SuppressionList: React.FC = () => {
  const [rows, setRows] = useState<SuppressedEntry[]>(INITIAL_ROWS)
  const [newRow, setNewRow] = useState<Omit<SuppressedEntry, "id" | "addedAt">>({
    email: "",
    reason: "",
    originalMessageId: "",
  })

  const handleAdd = () => {
    if (!newRow.email.trim()) return
    const entry: SuppressedEntry = {
      id: String(Date.now()),
      email: newRow.email,
      reason: newRow.reason,
      originalMessageId: newRow.originalMessageId,
      addedAt: null,
    }
    setRows((prev) => [...prev, entry])
    setNewRow({ email: "", reason: "", originalMessageId: "" })
  }

  const handleRemove = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const formatDate = (d: Date | null) => {
    if (!d) return "Now"
    return moment.utc(d).format("YYYY-MM-DD HH:mm [UTC]")
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>Suppression List</h2>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <Th>Email</Th>
            <Th>Reason</Th>
            <Th>Original Message ID</Th>
            <Th width={180}>Added</Th>
            <Th width={100}>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {/* New row (always first) */}
          <tr style={{ background: "#fafafa" }}>
            <Td>
              <EditableCell value={newRow.email} onChange={(v) => setNewRow((r) => ({ ...r, email: v }))} placeholder="blocked-user@example.com" />
            </Td>
            <Td>
              <EditableCell value={newRow.reason} onChange={(v) => setNewRow((r) => ({ ...r, reason: v }))} placeholder="Manual suppression due to repeated hard…" />
            </Td>
            <Td>
              <EditableCell value={newRow.originalMessageId} onChange={(v) => setNewRow((r) => ({ ...r, originalMessageId: v }))} placeholder="<orig-12345@cronus.eu-de-1.cloud.sap>" />
            </Td>
            <Td style={{ color: "#9ca3af", fontSize: 13 }}>Now</Td>
            <Td>
              <button
                onClick={handleAdd}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  background: "#fff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </Td>
          </tr>

          {/* Existing rows */}
          {rows.map((row) => (
            <tr key={row.id}>
              <Td>{row.email}</Td>
              <Td>{row.reason}</Td>
              <Td style={{ color: "#6b7280", fontSize: 13 }}>{row.originalMessageId || "—"}</Td>
              <Td style={{ color: "#6b7280", fontSize: 13 }}>{formatDate(row.addedAt)}</Td>
              <Td>
                <button
                  onClick={() => handleRemove(row.id)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    background: "#fff",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ padding: "12px 24px", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #f3f4f6" }}>
        Add a new suppressed email directly in the table.
      </div>
    </div>
  )
}

export default SuppressionList
