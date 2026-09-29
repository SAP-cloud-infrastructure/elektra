/*
 * Status component for displaying errors, loading states, and empty states
 * Based on Juno UI Components Status component
 */

import React, { ReactNode } from "react"
import { Spinner } from "@cloudoperators/juno-ui-components"

export interface StatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The status to display. Determines the default copy. Defaults to `"error"`. */
  status?: "progress" | "error" | "empty"
  /** Optional title. Overrides the per-status default title when set. */
  title?: string
  /** Optional body text. Overrides the per-status default body text when set. */
  body?: string
  /** Renders a `Spinner`. Defaults to `true` when `status="progress"`, `false` otherwise. */
  spinner?: boolean
  /** Rendered in a `<pre>` block using monospaced font. Intended for stack traces and server responses. */
  details?: string
  /** Optional action area rendered below the content. */
  action?: ReactNode
  /** Add custom CSS classes to the root element. */
  className?: string
}

const STATUS_DEFAULTS: Record<string, { title: string; body: string }> = {
  progress: { title: "Loading…", body: "" },
  error: { title: "Something Went Wrong", body: "An error occurred. Try again." },
  empty: { title: "No Items", body: "There are no items to display." },
}

export const Status = ({
  status = "error",
  title,
  body,
  spinner,
  details,
  action,
  className = "",
  ...props
}: StatusProps) => {
  const statusDefaults = status ? STATUS_DEFAULTS[status] : undefined

  const resolvedTitle = title ?? statusDefaults?.title
  const resolvedBody = body ?? statusDefaults?.body
  const resolvedSpinner = spinner ?? status === "progress"

  const role = status === "error" ? "alert" : "status"

  return (
    <div
      role={role}
      className={`tw-flex tw-flex-col tw-items-center tw-text-center tw-min-h-[12.5rem] tw-max-h-[18.1875rem] tw-justify-center tw-my-2 ${className}`}
      {...props}
    >
      {resolvedSpinner && <Spinner variant="primary" aria-label={resolvedTitle ?? "Loading"} />}
      {resolvedTitle && <strong className="tw-text-lg tw-leading-[1.5] tw-max-w-[50rem]">{resolvedTitle}</strong>}
      {resolvedBody && <div className="tw-leading-[1.5] tw-max-w-[50rem]">{resolvedBody}</div>}
      {details && (
        <pre
          aria-label="Error details"
          className="tw-text-left tw-text-xs tw-bg-theme-background-lvl-1 tw-text-theme-default tw-border tw-border-theme-background-lvl-3 tw-py-0.5 tw-px-1 tw-mt-4 tw-w-full tw-max-w-[50rem] tw-max-h-[30rem] tw-overflow-x-auto tw-overflow-y-auto tw-min-h-0"
        >
          {details}
        </pre>
      )}
      {action && <div className="tw-mt-4">{action}</div>}
    </div>
  )
}
