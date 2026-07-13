import React, { useState, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthData, useGlobalsCronusEndpoint } from "./StoreProvider"
import { LoadingIndicator, Stack } from "@cloudoperators/juno-ui-components"
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

// ─── Copy button ─────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      type="button"
      title="Copy to clipboard"
      style={{ padding: "6px 8px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: copied ? "#e0f2fe" : "#fff", color: copied ? "#038bc6" : "#374151", border: `1px solid ${copied ? "#038bc6" : "#d1d5db"}`, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 4 }}
    >
      {copied ? (
        <span style={{ fontSize: 13, fontWeight: 600 }}>Copied!</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
          <path fill="#0070f2" d="M73.36,96.21h-32.47c-9.28,0-16.84-7.55-16.84-16.84v-44.5c0-9.28,7.55-16.84,16.84-16.84h32.47c9.28,0,16.84,7.55,16.84,16.84v44.5c0,9.28-7.55,16.84-16.84,16.84ZM40.89,27.66c-3.98,0-7.22,3.24-7.22,7.22v44.5c0,3.98,3.24,7.22,7.22,7.22h32.47c3.98,0,7.22-3.24,7.22-7.22v-44.5c0-3.98-3.24-7.22-7.22-7.22h-32.47Z"/>
          <path fill="#0070f2" d="M10.82,72.16c-2.66,0-4.81-2.15-4.81-4.81V16.84C6.01,7.55,13.57,0,22.85,0h44.5c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81H22.85c-3.98,0-7.22,3.24-7.22,7.22v50.51c0,2.66-2.15,4.81-4.81,4.81Z"/>
        </svg>
      )}
    </button>
  )
}

// ─── Verify New Domain form ────────────────────────────────────────────────────

interface VerifyFormProps {
  bearerToken: string
  cronusEndpoint: string
  onSuccess?: () => void
}


const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
    {[1, 2, 3].map((s) => (
      <React.Fragment key={s}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700,
          background: s === step ? "#2563eb" : s < step ? "#038bc6" : "#f3f4f6",
          color: s === step ? "#fff" : s < step ? "#fff" : "#9ca3af",
          border: "none",
          flexShrink: 0,
        }}>{s < step ? "✓" : s}</div>
        {s < 3 && <div style={{ flex: 1, height: 2, background: s < step ? "#038bc6" : "#e5e7eb" }} />}
      </React.Fragment>
    ))}
  </div>
)

const STEP_TITLES = ["Domain & Selector", "Private Key", "Confirm & Verify"]

const VerifyNewDomain: React.FC<VerifyFormProps> = ({ bearerToken, cronusEndpoint, onSuccess }) => {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [domain, setDomain] = useState("")
  const [selector, setSelector] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [generatedPublicRecord, setGeneratedPublicRecord] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDomainValid = !!domain && DOMAIN_REGEX.test(domain)

  const createMutation = useMutation({
    mutationFn: (payload: PostDkimRequest) => createDkim(bearerToken, cronusEndpoint, domain, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headerDomains"] })
      queryClient.invalidateQueries({ queryKey: ["dkim", domain] })
      onSuccess?.()
    },
    onError: (e: Error) => {
      const msg = e.message ?? ""
      if (msg.includes("409") || msg.includes("too many email providers")) {
        setError("This domain is already configured with another email provider. Only one provider can be active at a time.")
      } else {
        setError(msg)
      }
    },
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      if (!text.includes("PRIVATE KEY") && !text.includes("BEGIN RSA")) {
        setError("The uploaded file does not appear to be a valid private key. Please upload a PEM-formatted private key.")
        return
      }
      const cleaned = text
        .replace(/-----BEGIN [^-]+-----/, "")
        .replace(/-----END [^-]+-----/, "")
        .replace(/\s+/g, "")
      setPrivateKey(cleaned)
      setGeneratedPublicRecord(null)
      setError(null)
      try {
        const der = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0))
        const privCryptoKey = await window.crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"])
        const jwk = await window.crypto.subtle.exportKey("jwk", privCryptoKey)
        const pubJwk: JsonWebKey = { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", use: "sig" }
        const pubKey = await window.crypto.subtle.importKey("jwk", pubJwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["verify"])
        const pubDer = await window.crypto.subtle.exportKey("spki", pubKey)
        const pubB64 = btoa(String.fromCharCode(...new Uint8Array(pubDer)))
        setGeneratedPublicRecord(`${selector}._domainkey.${domain} TXT "v=DKIM1; k=rsa; p=${pubB64}"`)
      } catch (err) {
        console.error("Key derivation failed:", err)
        setError("Could not derive public key from the uploaded file. Make sure it is an RSA private key in PEM format.")
      }
    }
    reader.readAsText(file)
  }

  const handleGenerate = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true, ["sign", "verify"]
      )
      const privDer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
      const pubDer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
      const toBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))
      setPrivateKey(toBase64(privDer))
      setGeneratedPublicRecord(`${selector}._domainkey.${domain} TXT "v=DKIM1; k=rsa; p=${toBase64(pubDer)}"`)
      setError(null)
    } catch {
      setError("Key generation failed.")
    }
  }

  const handleVerify = () => {
    createMutation.mutate({ selector, private_key: privateKey, enabled: true, rollover: true })
  }

  const navBtnStyle = (primary?: boolean): React.CSSProperties => ({
    padding: "8px 24px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer",
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#374151",
    border: primary ? "none" : "1px solid #d1d5db",
  })

  return (
    <div style={{ fontSize: 16 }}>
      <StepIndicator step={step} />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{STEP_TITLES[step - 1]}</h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        {step === 1 && "Enter the domain you want to verify and a selector name."}
        {step === 2 && "Upload an existing private key or generate a new one."}
        {step === 3 && "Publish the DNS record below, then click Verify Domain."}
      </p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f3f4f6", border: `1px solid ${domain && !isDomainValid ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 6, padding: "8px 14px", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, minWidth: 100, flexShrink: 0 }}>Email / Domain</span>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com"
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#111827", width: "100%" }} />
            </div>
            {domain && !isDomainValid && <span style={{ fontSize: 11, color: "#dc2626", paddingLeft: 4 }}>Enter a valid domain (e.g. example.com)</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 14px", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, minWidth: 100, flexShrink: 0 }}>Selector</span>
            <input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="selector1"
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#111827", width: "100%" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { setError(null); setStep(2) }} disabled={!isDomainValid || !selector} style={{ ...navBtnStyle(true), opacity: (!isDomainValid || !selector) ? 0.5 : 1, cursor: (!isDomainValid || !selector) ? "not-allowed" : "pointer" }}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => fileInputRef.current?.click()}>Upload Private Key</Btn>
            <Btn variant="primary" onClick={handleGenerate}>Generate New Key</Btn>
            <input ref={fileInputRef} type="file" accept=".pem,.key,.txt" style={{ display: "none" }} onChange={handleUpload} />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Upload an existing private key, or generate a new key pair.</div>
          <div style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#374151", wordBreak: "break-all", fontFamily: "monospace", height: 120, overflowY: "auto", position: "relative" }}>
            {privateKey ? (
              <>
                <div style={{ position: "absolute", top: 6, right: 6 }}><CopyButton text={privateKey} /></div>
                {privateKey}
              </>
            ) : (
              <span style={{ color: "#9ca3af" }}>Your private key will appear here.</span>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button onClick={() => { setError(null); setStep(1) }} style={navBtnStyle()}>← Back</button>
            <button onClick={() => { setError(null); setStep(3) }} disabled={!privateKey} style={{ ...navBtnStyle(true), opacity: !privateKey ? 0.5 : 1, cursor: !privateKey ? "not-allowed" : "pointer" }}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {generatedPublicRecord ? (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, fontSize: 12, fontFamily: "monospace", color: "#374151", wordBreak: "break-all", whiteSpace: "pre-wrap", minHeight: 120, maxHeight: 200, overflowY: "auto", position: "relative" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>TXT Record</div>
              <div>{generatedPublicRecord}</div>
              <div style={{ position: "absolute", top: 8, right: 8 }}><CopyButton text={generatedPublicRecord} /></div>
            </div>
          ) : (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, fontSize: 13, color: "#6b7280", minHeight: 80, display: "flex", alignItems: "center" }}>
              No DNS record generated — go back and generate or upload a key.
            </div>
          )}
          <div style={{ fontSize: 11, color: "#6b7280" }}>Publish this public key in DNS before verifying: <code>{selector}._domainkey.{domain}</code></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <button onClick={() => { setError(null); setStep(2) }} style={navBtnStyle()}>← Back</button>
            <button
              onClick={handleVerify}
              disabled={createMutation.isLoading || !generatedPublicRecord}
              style={{ ...navBtnStyle(true), padding: "10px 40px", fontSize: 15, opacity: (createMutation.isLoading || !generatedPublicRecord) ? 0.6 : 1, cursor: (createMutation.isLoading || !generatedPublicRecord) ? "not-allowed" : "pointer" }}
            >
              {createMutation.isLoading ? "Verifying…" : "Verify Domain"}
            </button>
          </div>
        </div>
      )}
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
  const [showConfirm, setShowConfirm] = useState(false)
  const { data: dkimData } = useQuery({
    queryKey: ["dkim", domain.domain, bearerToken, cronusEndpoint],
    queryFn: () => fetchDkim(bearerToken, cronusEndpoint, domain.domain),
    enabled: !!bearerToken && !!cronusEndpoint,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: () => {},
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
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          domain={domain.domain}
          onConfirm={() => onRemove(domain.domain)}
          onClose={() => setShowConfirm(false)}
        />
      )}
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
      <Td style={{ textAlign: "right", paddingRight: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowConfirm(true)}
            title="Remove domain"
            style={{ padding: "4px 6px", borderRadius: 6, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <svg width="20" height="20" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
              <path fill="#dc2626" d="M70.35,96.21H25.86c-5.97,0-10.82-4.86-10.82-10.82V30.07h-4.21c-2.66,0-4.81-2.15-4.81-4.81s2.15-4.81,4.81-4.81h13.23v-9.62c0-5.97,4.86-10.82,10.82-10.82h26.46c5.97,0,10.82,4.86,10.82,10.82v9.62h13.23c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81h-4.21v55.32c0,5.97-4.86,10.82-10.82,10.82ZM24.65,30.07v55.32c0,.66.54,1.2,1.2,1.2h44.5c.66,0,1.2-.54,1.2-1.2V30.07H24.65ZM33.67,20.44h28.86v-9.62c0-.66-.54-1.2-1.2-1.2h-26.46c-.66,0-1.2.54-1.2,1.2v9.62ZM58.93,78.17c-2.66,0-4.81-2.15-4.81-4.81v-26.46c0-2.66,2.15-4.81,4.81-4.81s4.81,2.15,4.81,4.81v26.46c0,2.66-2.15,4.81-4.81,4.81ZM37.28,78.17c-2.66,0-4.81-2.15-4.81-4.81v-26.46c0-2.66,2.15-4.81,4.81-4.81s4.81,2.15,4.81,4.81v26.46c0,2.66-2.15,4.81-4.81,4.81Z"/>
            </svg>
          </button>
        </div>
      </Td>
    </tr>
    </>
  )
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

const ConfirmDeleteModal: React.FC<{ domain: string; onConfirm: () => void; onClose: () => void }> = ({ domain, onConfirm, onClose }) => (
  <div
    style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
  >
    <div style={{ background: "#fff", borderRadius: 10, padding: 32, width: "min(420px, 95vw)", position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Remove Domain</h2>
      <p style={{ fontSize: 14, color: "#111827", marginBottom: 8 }}>Are you sure you want to remove:</p>
      <div style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", marginBottom: 8, fontSize: 15, fontWeight: 700, color: "#111827", wordBreak: "break-all" }}>
        {domain}
      </div>
      <p style={{ fontSize: 14, color: "#111827", marginBottom: 24 }}>This cannot be undone.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#fff", color: "#374151", border: "1px solid #d1d5db", cursor: "pointer" }}>Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }} style={{ padding: "8px 18px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer" }}>Remove</button>
      </div>
    </div>
  </div>
)

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
    <div style={{ background: "#fff", borderRadius: 10, padding: 32, width: "min(600px, 95vw)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
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

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["headerDomains", bearerToken, cronusEndpoint],
    queryFn: () => fetchHeaderDomains(bearerToken, cronusEndpoint),
    enabled: !!bearerToken && !!cronusEndpoint,
    staleTime: 30000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
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

      <Card style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        {isFetching && !isLoading && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LoadingIndicator />
          </div>
        )}
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
              <Th width={160}></Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                  <Stack alignment="center" distribution="center" style={{ minHeight: 80 }}>
                    <LoadingIndicator />
                  </Stack>
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
