import React from "react"

const BulletIcon: React.FC = () => (
  <svg width="5" height="5" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 10 }}>
    <circle cx="5" cy="5" r="5" fill="#038bc6" />
  </svg>
)

const SupportIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#038bc6"
      d="M61.33,96.21h-14.43c-1.26,0-2.53-.48-3.43-1.38-.9-.9-1.38-2.1-1.38-3.43v-4.93c0-2.65,2.16-4.81,4.81-4.81s4.81,2.16,4.81,4.81v.12h9.62c6.85,0,12.87-3.55,16.24-8.96-1.32.36-2.77.54-4.21.54h-8.42c-2.65,0-4.81-2.16-4.81-4.81v-26.46c0-2.65,2.16-4.81,4.81-4.81h15.63c-.6-18.04-14.91-32.47-32.47-32.47S16.3,24.05,15.63,42.09h15.63c2.65,0,4.81,2.16,4.81,4.81v26.46c0,2.65-2.16,4.81-4.81,4.81h-8.42c-9.26,0-16.84-7.58-16.84-16.84v-18.04C6.01,19.42,24.89,0,48.1,0s42.09,19.42,42.09,43.29v24.05c0,15.93-12.93,28.86-28.86,28.86ZM69.75,68.55h3.61c3.97,0,7.22-3.25,7.22-7.22v-9.62h-10.82v16.84ZM15.63,51.71v9.62c0,3.97,3.25,7.22,7.22,7.22h3.61v-16.84h-10.82Z"
    />
  </svg>
)

const DocIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#038bc6"
      d="M73.36,75.77h-20.44c-2.66,0-4.81-2.15-4.81-4.81s2.15-4.81,4.81-4.81h20.44c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81ZM85.39,57.73h-32.47c-2.66,0-4.81-2.15-4.81-4.81s2.15-4.81,4.81-4.81h32.47c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81ZM85.39,39.69h-32.47c-2.66,0-4.81-2.15-4.81-4.81s2.15-4.81,4.81-4.81h32.47c2.66,0,4.81,2.15,4.81,4.81s-2.15,4.81-4.81,4.81Z"
    />
    <path
      fill="#038bc6"
      fillRule="evenodd"
      d="M67.35,24.05c2.66,0,4.81-2.15,4.81-4.81V4.81c0-2.65-2.16-4.81-4.81-4.81H31.57c-1.4,0-2.74.61-3.65,1.68L1.16,32.95c-.75.87-1.16,1.98-1.16,3.13v55.32c0,2.66,2.16,4.81,4.81,4.81h62.54c2.66,0,4.81-2.16,4.81-4.81s-2.16-4.81-4.81-4.81H9.62v-48.73l1.52-1.78h9.33c5.26,0,9.51-4.27,9.51-9.55v-12.46l3.81-4.45h28.75v9.62c0,2.66,2.16,4.81,4.81,4.81Z"
    />
  </svg>
)

const SendMailIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#038bc6"
      d="M79.37,84.18H16.84c-9.28,0-16.84-7.55-16.84-16.84V28.86C0,19.58,7.55,12.03,16.84,12.03h62.54c9.28,0,16.84,7.55,16.84,16.84v38.48c0,9.28-7.55,16.84-16.84,16.84ZM9.62,32.24v35.11c0,3.98,3.24,7.22,7.22,7.22h62.54c3.98,0,7.22-3.24,7.22-7.22v-35.22l-29.22,19.22c-5.6,3.68-12.85,3.69-18.46.03l-29.29-19.13ZM12.84,22.85l31.32,20.47c2.4,1.57,5.51,1.57,7.91-.01l31.19-20.51c-1.13-.73-2.47-1.15-3.9-1.15H16.84c-1.48,0-2.85.44-3.99,1.21Z"
    />
  </svg>
)

const ManageAccountIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 83.45 94.52" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#038bc6"
      d="M83.38,16.59c-.12-1.97-1.43-3.67-3.31-4.29L43.22.24c-.97-.32-2.02-.32-2.99,0L3.37,12.31C1.49,12.92.18,14.62.06,16.59c-.03.56-.76,13.97,3.62,30.14,5.89,21.74,18.27,38.08,35.81,47.24.7.36,1.46.55,2.23.55s1.53-.18,2.23-.55c17.54-9.16,29.92-25.5,35.81-47.24,4.38-16.17,3.66-29.58,3.62-30.14ZM41.72,84.22c-5.24-3.04-9.62-6.72-13.3-10.75.02-.16.05-.31.05-.47v-5.45c0-7.25,5.9-13.16,13.16-13.16s13.16,5.9,13.16,13.16v5.45c0,.22.04.43.07.65-3.64,3.96-7.96,7.58-13.13,10.57ZM41.55,38.67c-2.82,0-5.12-2.3-5.12-5.12s2.3-5.12,5.12-5.12,5.12,2.3,5.12,5.12-2.3,5.12-5.12,5.12ZM63.56,61.42c-1.99-7.13-7.38-12.87-14.3-15.34,4.21-2.6,7.03-7.24,7.03-12.54,0-8.13-6.61-14.74-14.74-14.74s-14.74,6.61-14.74,14.74c0,5.32,2.85,9.98,7.09,12.58-6.8,2.46-12.1,8.08-14.14,15.07C11.02,45.08,9.76,27.47,9.64,20.37l32.08-10.5,32.08,10.5c-.12,7.13-1.38,24.88-10.24,41.05Z"
    />
  </svg>
)

const AlertIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 96.22 96.21" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#038bc6"
      d="M82,90.2H14.22c-5.18,0-9.95-2.74-12.44-7.14-2.42-4.27-2.36-9.34.16-13.55L35.83,12.87c2.57-4.29,7.16-6.86,12.28-6.86s9.71,2.56,12.28,6.86l33.89,56.63c2.52,4.22,2.58,9.28.16,13.55-2.5,4.4-7.26,7.14-12.44,7.14ZM48.11,15.63c-1.7,0-3.21.81-4.02,2.18L10.19,74.45c-1,1.67-.46,3.14-.05,3.87.8,1.42,2.33,2.26,4.07,2.26h67.78c1.75,0,3.27-.85,4.07-2.26.41-.73.95-2.19-.05-3.87L52.13,17.81c-.82-1.36-2.32-2.18-4.02-2.18ZM48.11,75.28c-3.25,0-5.89-2.64-5.89-5.88s2.64-5.88,5.89-5.88,5.89,2.64,5.89,5.88-2.64,5.88-5.89,5.88ZM48.11,55.58c-2.66,0-4.81-2.15-4.81-4.81v-15.98c0-2.66,2.15-4.81,4.81-4.81s4.81,2.15,4.81,4.81v15.98c0,2.66-2.15,4.81-4.81,4.81Z"
    />
  </svg>
)

const ReceiveMailIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 96.21 96.21" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#038bc6"
      d="M79.37,96.21H16.84c-9.28,0-16.84-7.55-16.84-16.84V30.87c0-6.82,4.07-12.92,10.36-15.54L46.25.37c1.18-.49,2.52-.49,3.7,0l35.89,14.96c6.29,2.62,10.36,8.72,10.36,15.54v48.51c0,9.28-7.55,16.84-16.84,16.84ZM9.62,38.43v40.94c0,3.98,3.24,7.22,7.22,7.22h62.54c3.98,0,7.22-3.24,7.22-7.22v-41.05l-29.24,19.05c-5.59,3.67-12.83,3.68-18.44.02l-29.29-18.96ZM10.45,27.5l33.7,21.82c2.42,1.58,5.53,1.58,7.93,0l33.63-21.91c-.77-1.41-2.01-2.56-3.56-3.2l-34.04-14.19L14.06,24.21c-1.59.66-2.85,1.84-3.61,3.3Z"
    />
  </svg>
)

const HeroIconBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      width: 44,
      height: 44,
      borderRadius: 12,
      background: "#fff",
      border: "1px solid #e5e7eb",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </span>
)

const Setup: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
    {/* Hero */}
    <div style={{ borderRadius: 12, padding: "24px 24px 24px 0", marginTop: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
        Welcome to the Email Service
      </h1>
      <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 20 }}>
        A multi-tenant email platform enabling SAP Lines of Business and SAP customers to:
      </p>
      <ul style={{ listStyle: "none", paddingLeft: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <HeroIconBadge>
            <SendMailIcon />
          </HeroIconBadge>
          <span style={{ fontSize: 16, color: "#111827" }}>
            Send transactional and marketing emails via SMTP
          </span>
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <HeroIconBadge>
            <ReceiveMailIcon />
          </HeroIconBadge>
          <span style={{ fontSize: 16, color: "#111827" }}>
            Receive inbound emails, including NDRs, replies, and incoming customer emails
          </span>
        </li>
      </ul>
    </div>

    {/* Manage Account */}
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 24,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#dbeafe",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ManageAccountIcon />
        </span>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Manage Account</h2>
          <p style={{ fontSize: 16, color: "#6b7280" }}>
            Use the Cronus CLI to manage your Cronus accounts for your SAP Cloud Infrastructure project.
          </p>
        </div>
      </div>
      
      <div style={{ paddingLeft: 16 }}>
        <div style={{ fontSize: 16, color: "#374151", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <DocIcon />
        <span><strong>Docs:</strong>{" "}
        <a
          href="https://documentation.global.cloud.sap/docs/customer/services/email-service/"
          style={{ color: "#2563eb" }}
          target="_blank"
          rel="noreferrer"
        >
          Email Service
        </a></span>
        </div>
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 16,
            color: "#374151",
          }}
        >
          <AlertIcon />
          <span>
            <strong>Important note:</strong> Avoid managing more than one email backend on the same
            project — use a dedicated project for each.
          </span>
        </div>
      </div>
    </div>

    {/* Support */}
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 24,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#dbeafe",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SupportIcon />
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Support</h2>
      </div>
      <ul style={{ listStyle: "none", paddingLeft: 24, fontSize: 16, color: "#374151" }}>
        <li style={{ marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <BulletIcon />
          <span>Email:{" "}
          <a
            href="mailto:cronus-support@sap.com"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            cronus-support@sap.com
          </a></span>
        </li>
        <li style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <BulletIcon />
          <span>Incident Management:{" "}
          <a
            href="https://documentation.global.cloud.sap/docs/customer/services/email-service/email-aws/incident-management/"
            style={{ color: "#2563eb", textDecoration: "underline" }}
            target="_blank"
            rel="noreferrer"
          >
            https://documentation.global.cloud.sap/docs/customer/services/email-service/email-aws/incident-management/
          </a></span>
        </li>
      </ul>
    </div>
  </div>
)

export default Setup
