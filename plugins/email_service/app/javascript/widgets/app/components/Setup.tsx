import React from "react"

interface SectionProps {
  title?: string
  children: React.ReactNode
  accentColor?: "blue" | "green"
}

const Section: React.FC<SectionProps> = ({ title, children, accentColor }) => {
  const borderLeft =
    accentColor === "blue"
      ? "4px solid #3b82f6"
      : accentColor === "green"
        ? "4px solid #22c55e"
        : undefined
  const titleColor =
    accentColor === "blue" ? "#2563eb" : accentColor === "green" ? "#16a34a" : undefined

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        padding: 24,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        ...(borderLeft ? { borderLeft } : {}),
      }}
    >
      {title && (
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: titleColor ?? "#111827" }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

const InfoBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: "#ebf8ff",
      borderLeft: "4px solid #3182ce",
      color: "#2c5282",
      borderRadius: 4,
      padding: "12px 16px",
      fontSize: 14,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
)

const WarnBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: "#fff5f5",
      borderLeft: "4px solid #e53e3e",
      color: "#c53030",
      borderRadius: 4,
      padding: "12px 16px",
      fontSize: 14,
    }}
  >
    {children}
  </div>
)

const Setup: React.FC = () => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
    <Section>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
        Enable Account
      </h1>
      <InfoBox>
        <p style={{ marginBottom: 8 }}>
          Use the Cronus CLI to activate, reconcile, and delete Cronus accounts for your SAP Cloud
          Infrastructure project.
        </p>
        <p>
          Docs:{" "}
          <a
            href="https://documentation.global.cloud.sap/docs/customer/services/email-service/"
            style={{ color: "#2563eb" }}
            target="_blank"
            rel="noreferrer"
          >
            Email Service
          </a>
        </p>
      </InfoBox>
      <div style={{ marginTop: 12 }}>
        <WarnBox>
          ⚠ Do <strong>not</strong> enable more than one email backend on the same project — use a
          dedicated project for each.
        </WarnBox>
      </div>
    </Section>

    <Section>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
        Support
      </h2>
      <ul style={{ listStyle: "disc", paddingLeft: 20, fontSize: 14, color: "#374151" }}>
        <li style={{ marginBottom: 4 }}>
          Email:{" "}
          <a
            href="mailto:cronus-support@sap.com"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            cronus-support@sap.com
          </a>
        </li>
        <li>
          Incident Management:{" "}
          <a
            href="https://documentation.global.cloud.sap/docs/customer/services/email-service/email-aws/incident-management/"
            style={{ color: "#2563eb", textDecoration: "underline" }}
            target="_blank"
            rel="noreferrer"
          >
            https://documentation.global.cloud.sap/docs/customer/services/email-service/email-aws/incident-management/
          </a>
        </li>
      </ul>
    </Section>
  </div>
)

export default Setup
