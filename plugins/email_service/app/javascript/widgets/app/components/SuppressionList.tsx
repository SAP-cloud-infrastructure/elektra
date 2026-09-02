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
  const [confirmId, setConfirmId] = useState<string | null>(null)

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
    setConfirmId(null)
  }

  const formatDate = (d: Date | null) => {
    if (!d) return "Now"
    return moment.utc(d).format("YYYY-MM-DD HH:mm [UTC]")
  }

  const confirmRow = rows.find((r) => r.id === confirmId)

  return (
    <>
      {confirmId && confirmRow && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null) }}
        >
          <div style={{ background: "#fff", borderRadius: 10, padding: 32, width: "min(420px, 95vw)", position: "relative" }}>
            <button onClick={() => setConfirmId(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Delete {confirmRow.email}</h2>
            <p style={{ fontSize: 14, color: "#111827", marginBottom: 8 }}>Are you sure you want to remove:</p>
            <div style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", marginBottom: 8, fontSize: 15, fontWeight: 700, color: "#111827", wordBreak: "break-all" }}>
              {confirmRow.email}
            </div>
            <p style={{ fontSize: 14, color: "#111827", marginBottom: 24 }}>This cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setConfirmId(null)} style={{ padding: "8px 18px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#fff", color: "#374151", border: "1px solid #d1d5db", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleRemove(confirmId)} style={{ padding: "8px 18px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
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
            <Th width={180}>Date Added</Th>
            <Th width={60} style={{ textAlign: "center" }}>Actions</Th>
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
            <Td style={{ textAlign: "center" }}>
              <button
                onClick={handleAdd}
                title="Add"
                style={{ padding: "4px 6px", borderRadius: 6, background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
              >
                <svg width="20" height="20" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#0070f2" d="M48.1,90.2c-2.66,0-4.81-2.15-4.81-4.81v-32.47H10.82c-2.66,0-4.81-2.15-4.81-4.81s2.15-4.81,4.81-4.81h32.47V10.82c0-2.66,2.15-4.81,4.81-4.81s4.81,2.15,4.81,4.81v32.47h32.47c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81h-32.47v32.47c0,2.66-2.15,4.81-4.81,4.81Z"/>
                </svg>
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
              <Td style={{ textAlign: "center" }}>
                <button
                  onClick={() => setConfirmId(row.id)}
                  title="Remove"
                  style={{ padding: "4px 6px", borderRadius: 6, background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <svg width="20" height="20" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#dc2626" d="M70.35,96.21H25.86c-5.97,0-10.82-4.86-10.82-10.82V30.07h-4.21c-2.66,0-4.81-2.15-4.81-4.81s2.15-4.81,4.81-4.81h13.23v-9.62c0-5.97,4.86-10.82,10.82-10.82h26.46c5.97,0,10.82,4.86,10.82,10.82v9.62h13.23c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81h-4.21v55.32c0,5.97-4.86,10.82-10.82,10.82ZM24.65,30.07v55.32c0,.66.54,1.2,1.2,1.2h44.5c.66,0,1.2-.54,1.2-1.2V30.07H24.65ZM33.67,20.44h28.86v-9.62c0-.66-.54-1.2-1.2-1.2h-26.46c-.66,0-1.2.54-1.2,1.2v9.62ZM58.93,78.17c-2.66,0-4.81-2.15-4.81-4.81v-26.46c0-2.66,2.15-4.81,4.81-4.81s4.81,2.15,4.81,4.81v26.46c0,2.66-2.15,4.81-4.81,4.81ZM37.28,78.17c-2.66,0-4.81-2.15-4.81-4.81v-26.46c0-2.66,2.15-4.81,4.81-4.81s4.81,2.15,4.81,4.81v26.46c0,2.66-2.15,4.81-4.81,4.81Z"/>
                  </svg>
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
    </>
  )
}

export default SuppressionList
