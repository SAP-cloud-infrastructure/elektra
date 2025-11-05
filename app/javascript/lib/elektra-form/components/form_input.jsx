//import React from 'react';
import React, { useContext } from "react"
import { FormContext } from "./form_context"

export const FormInput = ({
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

  let values = context.formValues || {}
  let isValid = true
  if (context.formErrors && typeof context.formErrors === "object" && context.formErrors[name]) {
    isValid = false
  }

  const { type } = otherProps || {}
  let newClassName = type === "checkbox" || type === "radio" ? "form-check-input" : "form-control"
  newClassName += " " + (required ? "required" : "optional")
  newClassName += " " + (isValid ? "" : "is-invalid")

  const handleChange = (e) => {
    //e.preventDefault()
    const target = e.target
    const value = target.type === "checkbox" ? target.checked : target.value
    const name = target.name

    context.onChange(name, value)
  }

  let inputProps = {
    "data-testid": testId,
    className: `${newClassName} ${className}`,
    name,
    id: id || (context.formName ? context.formName + "_" + name : name),
    onChange: handleChange,
    ...otherProps,
  }
  if (type === "checkbox") inputProps.checked = values[name] === true
  else inputProps.value = values[name] || ""

  return React.createElement(elementType, inputProps, children)
}
