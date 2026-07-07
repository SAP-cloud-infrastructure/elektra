import React, { useState, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthData, useGlobalsCronusEndpoint } from "./StoreProvider"
import {
  fetchHeaderDomains,
  fetchDkim,
  createDkim,
  HeaderDomain,
  DkimResponse,
  PostDkimRequest,
} from "../actions"

// ─── Status badge ────────────────────────────────────────────────────────────

type BadgeVariant = "verified" | "pending" | "failed"

const badgeStyle = (variant: BadgeVariant): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid",
  }
  if (variant === "verified") return { ...base, color: "#166534", background: "#dcfce7", borderColor: "#bbf7d0" }
  if (variant === "pending") return { ...base, color: "#92400e", background: "#fef3c7", borderColor: "#fde68a" }
  return { ...base, color: "#991b1b", background: "#fee2e2", borderColor: "#fecaca" }
}

const toBadgeVariant = (status: string | undefined): BadgeVariant => {
  if (!status) return "pending"
  const s = status.toLowerCase()
  if (s === "success" || s === "verified") return "verified"
  if (s.includes("fail") || s.includes("error")) return "failed"
  return "pending"
}

const Badge: React.FC<{ label: string; variant: BadgeVariant }> = ({ label, variant }) => (
  <span style={badgeStyle(variant)}>{label}</span>
)

// ─── Card wrapper ─────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      padding: 24,
      ...style,
    }}
  >
    {children}
  </div>
)

// ─── Field row (label + value in a shaded box) ────────────────────────────────

const FieldBox: React.FC<{ label: string; value: string; labelWidth?: number }> = ({ label, value, labelWidth = 90 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      borderRadius: 6,
      padding: "10px 14px",
      gap: 12,
    }}
  >
    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, minWidth: labelWidth }}>{label}</span>
    <span style={{ fontSize: 14, color: "#111827" }}>{value}</span>
  </div>
)

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"

const Btn: React.FC<{
  onClick?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  type?: "button" | "submit"
  style?: React.CSSProperties
}> = ({ onClick, variant = "secondary", disabled, loading, children, type = "button", style }) => {
  const base: React.CSSProperties = {
    padding: "6px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  }
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
    secondary: { background: "#fff", color: "#374151", borderColor: "#d1d5db" },
    danger: { background: "#fff", color: "#dc2626", borderColor: "#fca5a5" },
    ghost: { background: "transparent", color: "#2563eb", borderColor: "transparent" },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ ...base, ...variants[variant] }}>
      {loading ? "..." : children}
    </button>
  )
}

// ─── Table primitives ─────────────────────────────────────────────────────────

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
  <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151", borderBottom: "1px solid #f3f4f6", ...style }}>
    {children}
  </td>
)

// ─── Verify New Domain form ────────────────────────────────────────────────────

interface VerifyFormProps {
  bearerToken: string
  cronusEndpoint: string
}

const VerifyNewDomain: React.FC<VerifyFormProps> = ({ bearerToken, cronusEndpoint, onSuccess }) => {
  const queryClient = useQueryClient()
  const [domain, setDomain] = useState("")
  const [selector, setSelector] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [generatedPublicRecord, setGeneratedPublicRecord] = useState<string | null>(null)
  const [storageRef, setStorageRef] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useMutation({
    mutationFn: (payload: PostDkimRequest) => createDkim(bearerToken, cronusEndpoint, domain, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headerDomains"] })
      queryClient.invalidateQueries({ queryKey: ["dkim", domain] })
      onSuccess?.()
    },
    onError: (e: Error) => setError(e.message),
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const cleaned = text
        .replace(/-----BEGIN [^-]+-----/, "")
        .replace(/-----END [^-]+-----/, "")
        .replace(/\s+/g, "")
      setPrivateKey(cleaned)
      setGeneratedPublicRecord(null)
    }
    reader.readAsText(file)
  }

  const handleGenerate = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["sign", "verify"]
      )
      const privDer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
      const pubDer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
      const toBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))
      const privB64 = toBase64(privDer)
      const pubB64 = toBase64(pubDer)
      setPrivateKey(privB64)
      setStorageRef(domain && selector ? `barbican://dkim/${domain}/${selector}` : "")
      setGeneratedPublicRecord(
        `${selector}._domainkey.${domain} TXT "v=DKIM1; k=rsa; p=${pubB64.slice(0, 40)}..."`
      )
      setError(null)
    } catch {
      setError("Key generation failed.")
    }
  }

  const handleVerify = () => {
    if (!domain || !selector || !privateKey) {
      setError("Domain, selector and private key are required.")
      return
    }
    createMutation.mutate({ selector, private_key: privateKey, enabled: true, rollover: true })
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Verify New Domain</h2>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Domain + Selector inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 14px", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, minWidth: 90, flexShrink: 0 }}>Email / Domain</span>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.customer.com"
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#111827", width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 14px", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, minWidth: 60, flexShrink: 0 }}>Selector</span>
          <input
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="selector1"
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#111827", width: "100%" }}
          />
        </div>
      </div>

      {/* Private Key + Public DNS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Private Key</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Btn onClick={() => fileInputRef.current?.click()}>Upload Private Key</Btn>
            <Btn variant="ghost" onClick={handleGenerate}>Generate New Key</Btn>
            <input ref={fileInputRef} type="file" accept=".pem,.key,.txt" style={{ display: "none" }} onChange={handleUpload} />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Upload an existing private key, or generate a new key pair and save the private key in Barbican.
          </div>
          {storageRef && <FieldBox label="Storage" value={storageRef} />}
          {privateKey && !storageRef && (
            <div style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#374151", wordBreak: "break-all", fontFamily: "monospace" }}>
              {privateKey.slice(0, 60)}...
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Btn variant="ghost" style={{ borderColor: "#6b7280", color: "#374151" }}>Save in Barbican</Btn>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Public DNS Record</div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, fontSize: 12, fontFamily: "monospace", color: "#374151", minHeight: 80, marginBottom: 8, overflow: "auto" }}>
            {generatedPublicRecord ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>TXT Record</div>
                <div style={{ wordBreak: "break-all" }}>{generatedPublicRecord}</div>
              </>
            ) : (
              <span style={{ color: "#9ca3af" }}>Generate or upload a key to see the DNS record.</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>
            Publish this public key in DNS using: selector._domainkey.domain
          </div>
          <Btn variant="primary" onClick={handleVerify} loading={createMutation.isLoading}>
            Verify Domain
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Domain row with DKIM inline ───────────────────────────────────────────────

interface DomainRowProps {
  domain: HeaderDomain
  bearerToken: string
  cronusEndpoint: string
  onRemove: (domain: string) => void
}

const DomainRow: React.FC<DomainRowProps> = ({ domain, bearerToken, cronusEndpoint, onRemove }) => {
  const { data: dkimData } = useQuery({
    queryKey: ["dkim", domain.domain, bearerToken, cronusEndpoint],
    queryFn: () => fetchDkim(bearerToken, cronusEndpoint, domain.domain),
    enabled: !!bearerToken && !!cronusEndpoint,
    staleTime: 30000,
  })

  const dkimList: DkimResponse[] = dkimData?.data ?? []
  const primaryDkim = dkimList[0]
  const dkimVariant = toBadgeVariant(primaryDkim?.verification_status)
  const dkimLabel = primaryDkim
    ? primaryDkim.verification_status === "Success" || primaryDkim.verification_status === "success"
      ? "Verified"
      : primaryDkim.verification_status ?? "Pending DNS"
    : "—"

  return (
    <tr>
      <Td>{domain.domain}</Td>
      <Td>
        {primaryDkim ? (
          <Badge label={dkimLabel} variant={dkimVariant} />
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
        )}
      </Td>
      <Td>
        {primaryDkim ? (
          <Badge label={dkimLabel} variant={dkimVariant} />
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
        )}
      </Td>
      <Td>
        <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
      </Td>
      <Td>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setEditingConfig(true)}
            style={{ padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, background: "#fff", color: "#374151", border: "1px solid #d1d5db", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Set Config
          </button>
          <button
            onClick={() => onRemove(domain.domain)}
            style={{ padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Remove
          </button>
        </div>
      </Td>
    </tr>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div
    style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
  >
    <div style={{ background: "#fff", borderRadius: 10, padding: 32, width: "min(860px, 95vw)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}
      >
        ×
      </button>
      {children}
    </div>
  </div>
)

// ─── Main component ────────────────────────────────────────────────────────────

const EmailIdentityDomains: React.FC = () => {
  const bearerToken = useAuthData() ?? ""
  const cronusEndpoint = useGlobalsCronusEndpoint() ?? ""

  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["headerDomains", bearerToken, cronusEndpoint],
    queryFn: () => fetchHeaderDomains(bearerToken, cronusEndpoint),
    enabled: !!bearerToken && !!cronusEndpoint,
    staleTime: 30000,
  })

  const removeMutation = useMutation({
    mutationFn: async (_domain: string) => {
      // No DELETE on header-domains in harmonized API — placeholder
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["headerDomains"] }),
  })

  const domains: HeaderDomain[] = data?.data ?? []

  if (!cronusEndpoint) {
    return (
      <div style={{ padding: 24, color: "#6b7280", fontSize: 14 }}>
        Cronus endpoint not configured. Pass <code>cronus-endpoint</code> to the widget.
      </div>
    )
  }

  return (
    <>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <VerifyNewDomain
            bearerToken={bearerToken}
            cronusEndpoint={cronusEndpoint}
            onSuccess={() => setShowModal(false)}
          />
        </Modal>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>Email Identity Domains</h2>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: "7px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Add Domain
          </button>
        </div>

        {isError && (
          <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 14px", fontSize: 13, margin: "16px 24px" }}>
            {(() => {
              const msg = (error as Error)?.message ?? ""
              if (msg.includes("401") || msg.includes("403") || msg.includes("insufficient permissions") || msg.includes("authentication failed")) {
                return "You don't have the required permissions to manage email identity domains. Please ask your project admin to assign you the email_user or email_admin role."
              }
              return msg || "Failed to load domains."
            })()}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Domain</Th>
              <Th width={120}>Status</Th>
              <Th width={140}>DKIM</Th>
              <Th width={200}>Configuration Set</Th>
              <Th width={160}>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                  Loading…
                </td>
              </tr>
            ) : domains.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  No domains configured.
                </td>
              </tr>
            ) : (
              domains.map((d) => (
                <DomainRow
                  key={d.domain}
                  domain={d}
                  bearerToken={bearerToken}
                  cronusEndpoint={cronusEndpoint}
                  onRemove={(dom) => removeMutation.mutate(dom)}
                />
              ))
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}

export default EmailIdentityDomains
