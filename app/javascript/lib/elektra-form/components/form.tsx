import React, { useState, useEffect, useRef } from "react"
import { FormContext } from "./form_context"

interface FormValues {
  [key: string]: any
}

interface FormProps {
  initialValues?: FormValues
  validate: (values: FormValues) => boolean
  onSubmit: (values: FormValues) => Promise<any>
  resetForm?: boolean
  onValueChange?: (name: string | FormValues, values: FormValues) => void
  className?: string
  children?: React.ReactNode
}

const Form: React.FC<FormProps> = ({
  initialValues = {},
  resetForm = true,
  validate,
  onSubmit,
  onValueChange,
  className,
  children,
}) => {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [isValid, setIsValid] = useState(() => (validate ? validate(initialValues) : true))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string> | null>(null)

  // Use refs to track previous values to avoid infinite loops
  const prevInitialValues = useRef(initialValues)

  useEffect(() => {
    if (initialValues !== prevInitialValues.current && initialValues && Object.keys(values).length === 0) {
      setValues(initialValues)
      setIsValid(validate ? validate(initialValues) : true)
    }
    prevInitialValues.current = initialValues
  }, [initialValues, validate, values])

  const resetFormHandler = () => {
    setValues({})
    setIsValid(validate ? validate({}) : false)
    setIsSubmitting(false)
    setErrors(null)
  }

  const updateValue = (name: string | FormValues, value?: any) => {
    let newValues: FormValues

    if (typeof name === "object") {
      newValues = { ...values, ...name }
    } else {
      newValues = { ...values, [name]: value }
    }

    const newIsValid = validate ? validate(newValues) : true

    setValues(newValues)
    setIsValid(newIsValid)

    // Call onValueChange after state update to match original behavior
    if (onValueChange) {
      // Use setTimeout to match the original class component callback behavior
      setTimeout(() => {
        onValueChange(name, newValues)
      }, 0)
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    updateValue(e.target.name, e.target.value)
  }

  const onSubmitHandler = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()

    setIsSubmitting(true)
    setErrors(null)

    // Capture current values to avoid closure issues
    const currentValues = values

    onSubmit(currentValues)
      .then(() => {
        setIsSubmitting(false)
        if (resetForm) {
          resetFormHandler()
        }
      })
      .catch((reason: any) => {
        setIsSubmitting(false)
        setErrors(reason?.errors || null)
      })
  }

  const contextValue = {
    formValues: values,
    onChange: updateValue,
    isFormSubmitting: isSubmitting,
    isFormValid: isValid,
    formErrors: errors,
  }

  return (
    <form data-testid="elektra-form" className={className} onSubmit={onSubmitHandler}>
      {isSubmitting}
      <FormContext.Provider value={contextValue}>
        {React.Children.map(children, (formElement) => {
          if (!formElement) return null
          return React.cloneElement(formElement as React.ReactElement<{ values?: FormValues }>, { values })
        })}
      </FormContext.Provider>
    </form>
  )
}

Form.displayName = "Form"
export default Form
export type { FormProps, FormValues }
