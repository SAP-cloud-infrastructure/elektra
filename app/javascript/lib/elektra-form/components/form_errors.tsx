import React, { useContext } from "react"
import { FormContext } from "./form_context"
import { ErrorsList } from "./errors_list"

// Define a recursive type for errors
type ErrorValue = string | number | boolean | ErrorArray | ErrorObject
type ErrorArray = ErrorValue[]
type ErrorObject = { [key: string]: ErrorValue }

export type Errors = ErrorValue | null | undefined

interface FormErrorsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  errors?: Errors
}

export const FormErrors: React.FC<FormErrorsProps> = ({ className = "alert alert-error", errors, ...otherProps }) => {
  const context = useContext(FormContext)

  // return null if no errors given
  const localErrors = errors || context.formErrors
  if (!localErrors) return null

  return (
    <div className={className} {...otherProps}>
      <ErrorsList errors={localErrors} />
    </div>
  )
}
