import type { ReactNode } from "react"

// Horizontal form row mirroring the legacy compute create form (SimpleForm
// :horizontal_form wrapper): a right-aligned label in a col-sm-4 column and the
// field in a col-sm-8 column. Required fields get the same
// `<abbr title="required">*</abbr>` marker (native tooltip) the legacy form
// renders. The right-alignment comes from the global
// `.form-horizontal .col-form-label` rule, so an ancestor must carry the
// `form-horizontal` class (see FormHorizontal).
export function FormRow({
  label,
  htmlFor,
  required,
  hint,
  warning,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  warning?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="row mb-3">
      <label className="col-sm-4 col-form-label" htmlFor={htmlFor}>
        {required && <abbr title="required">*</abbr>} {label}
      </label>
      <div className="col-sm-8">
        <div className="input-wrapper">{children}</div>
        {error && <span className="invalid-feedback d-block">{error}</span>}
        {warning && (
          <div className="alert alert-warning mt-2 mb-0 py-2 px-3" role="alert">
            {warning}
          </div>
        )}
        {hint && (
          <p className="form-text">
            {/* A textual hint gets the legacy info-circle marker; a node hint
                (e.g. an inline loader) is rendered as-is. */}
            {typeof hint === "string" && <i className="fa fa-info-circle" />}
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

// A subtle group separator: extra vertical space between field blocks, with no
// heading or divider line — just enough breathing room to make logical groups
// scannable without the weight of section headers or rules.
export function SectionGap() {
  return <div className="create-instance-section-gap" aria-hidden="true" />
}

// Wraps a block of FormRows so their labels right-align (the global
// `.form-horizontal .col-form-label` rule needs the class as an ancestor). Use
// in modals that have no <form> element — a plain div carrying the class is
// enough, since the rule only keys off the class, not a real form.
export function FormHorizontal({ children }: { children: ReactNode }) {
  return <div className="form-horizontal">{children}</div>
}
