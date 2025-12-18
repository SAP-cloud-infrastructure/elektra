import React, { useContext, ReactNode, ReactElement } from "react"
import { FormContext, FormContextType } from "./form_context"

export interface FormElementProps {
  label: string
  required?: boolean
  name: string
  horizontal?: boolean
  inline?: boolean
  labelWidth?: number
  labelClass?: string
  children?: ReactNode
}

interface ChildElementProps {
  name?: string
  [key: string]: unknown
}

export const FormElement: React.FC<FormElementProps> = ({
  label,
  required = false,
  name,
  horizontal = false,
  inline = false,
  labelWidth = 4,
  labelClass = "control-label",
  children,
}) => {
  const context = useContext<FormContextType>(FormContext)

  const id = context.formName ? `${context.formName}_${name}` : name

  let isValid = true
  if (context.formErrors && typeof context.formErrors === "object" && context.formErrors[name]) {
    isValid = false
  }

  const renderLabel = (): ReactElement => {
    let className = `${labelClass} ${required ? "required" : "optional"}`
    if (horizontal) {
      className = `${className} col-sm-${labelWidth}`
    }

    return (
      <label className={className} htmlFor={id}>
        {required && <abbr title="required">*</abbr>}
        {label}
      </label>
    )
  }

  const childName = (child: ReactElement<ChildElementProps>): string => child.props?.name ?? name

  const renderChildren = (): ReactNode => {
    return React.Children.map(children, (child) => {
      if (child === null) {
        return null
      }
      if (typeof child === "string") {
        return child
      }
      if (React.isValidElement<ChildElementProps>(child)) {
        return React.cloneElement(child, {
          name: childName(child as ReactElement<ChildElementProps>),
        })
      }
      return child
    })
  }

  const renderInputWrapper = (): ReactNode => {
    if (inline) {
      return renderChildren()
    }
    return <div className="input-wrapper">{renderChildren()}</div>
  }

  return (
    <div className={`form-group ${inline ? "" : "row"} ${isValid ? "" : "has-error"}`}>
      {renderLabel()}
      {horizontal ? <div className={`col-sm-${12 - labelWidth}`}>{renderInputWrapper()}</div> : renderInputWrapper()}
    </div>
  )
}

export const FormElementHorizontal: React.FC<FormElementProps> = (props) => <FormElement {...props} horizontal={true} />

export const FormElementInline: React.FC<Omit<FormElementProps, "inline">> = ({ ...props }) => (
  <FormElement {...props} inline={true} />
)
