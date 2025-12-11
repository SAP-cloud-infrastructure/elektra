import React, { useContext, ChangeEvent } from "react"
import { FormContext } from "./form_context"

export interface FormInputProps extends React.HTMLAttributes<HTMLElement> {
  testId?: string
  elementType: keyof JSX.IntrinsicElements
  id?: string
  className?: string
  required?: boolean
  name: string
  type?: string
  children?: React.ReactNode
  [key: string]: any // For other props like placeholder, disabled, etc.
}

export const FormInput: React.FC<FormInputProps> = ({
  testId,
  elementType,
  id,
  className = "",
  required = false,
  name,
  children,
  ...otherProps
}) => {
  const context = useContext(FormContext)

  const values = context.formValues || {}
  let isValid = true
  if (context.formErrors && typeof context.formErrors === "object" && context.formErrors[name]) {
    isValid = false
  }

  const { type } = otherProps || {}
  let newClassName = type === "checkbox" || type === "radio" ? "form-check-input" : "form-control"
  newClassName += " " + (required ? "required" : "optional")
  newClassName += " " + (isValid ? "" : "is-invalid")

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const value = (target as HTMLInputElement).type === "checkbox" ? (target as HTMLInputElement).checked : target.value
    const name = target.name

    context.onChange && context.onChange(name, value)
  }

  const inputProps: any = {
    "data-testid": testId,
    className: `${newClassName} ${className}`,
    name,
    id: id || (context.formName ? context.formName + "_" + name : name),
    onChange: handleChange,
    ...otherProps,
  }

  if (type === "checkbox") {
    inputProps.checked = values[name] === true
  } else {
    inputProps.value = values[name] || ""
  }

  return React.createElement(elementType, inputProps, children)
}
