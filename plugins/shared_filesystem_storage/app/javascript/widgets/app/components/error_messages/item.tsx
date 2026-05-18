import React, { useState } from "react"
import { PrettyDate } from "lib/components/pretty_date"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorMessage {
  id?: string
  project_id?: string
  resource_type?: string
  resource_id?: string
  detail_id?: string
  action_id?: string
  request_id?: string
  created_at?: string
  expires_at?: string
  message_level?: string
  user_message?: string
}

interface ErrorMessageItemProps {
  errorMessage: ErrorMessage
}

// ─── Component ────────────────────────────────────────────────────────────────

const DETAIL_FIELDS: Array<keyof ErrorMessage> = [
  "project_id",
  "id",
  "resource_type",
  "resource_id",
  "detail_id",
  "action_id",
  "request_id",
  "created_at",
  "expires_at",
]

const ErrorMessageItem: React.FC<ErrorMessageItemProps> = ({ errorMessage }) => {
  const [showDetails, setShowDetails] = useState(false)

  const toggleDetails = () => setShowDetails((prev) => !prev)

  return (
    <>
      <tr>
        <td>
          <a
            onClick={(e) => {
              e.preventDefault()
              toggleDetails()
            }}
          >
            {showDetails ? (
              <i className="fa fa-fw fa-caret-down" />
            ) : (
              <i className="fa fa-fw fa-caret-right" />
            )}
          </a>
          {errorMessage.message_level}
        </td>
        <td>{errorMessage.user_message}</td>
        <td>
          <PrettyDate date={errorMessage.created_at} />
        </td>
      </tr>
      {showDetails && (
        <tr className="details">
          <td colSpan={3}>
            <table className="table no-borders">
              <tbody>
                {DETAIL_FIELDS.map((key) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{errorMessage[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default ErrorMessageItem
