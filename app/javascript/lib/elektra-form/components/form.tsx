import React, { useState, useEffect, useRef } from "react"
import { FormContext } from "./form_context"
import makeCancelable from "lib/tools/cancelable_promise"

interface FormValues {
  [key: string]: unknown
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
  initialValues,
  resetForm = true,
  validate,
  onSubmit,
  onValueChange,
  className,
  children,
}) => {
  const [values, setValues] = useState<FormValues>(initialValues || {})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string> | null>(null)
  const [isTouched, setIsTouched] = useState(false) // Track if user has made changes

  // Use refs to track previous values to avoid infinite loops
  const prevInitialValues = useRef(initialValues)

  useEffect(() => {
    if (initialValues && initialValues !== prevInitialValues.current && !isTouched) {
      setValues(initialValues)
    }
    prevInitialValues.current = initialValues
  }, [initialValues, isTouched])

  const resetFormHandler = () => {
    setValues({})
    setIsSubmitting(false)
    setErrors(null)
    setIsTouched(false) // Reset touched state
  }

  const updateValue = (name: string | FormValues, value?: any) => {
    const newValues = typeof name === "object" ? { ...values, ...name } : { ...values, [name]: value }

    setValues(newValues)
    setIsTouched(true)

    if (onValueChange) {
      onValueChange(name, newValues)
    }
  }

  const onSubmitHandler = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()

    setIsSubmitting(true)
    setErrors(null)

    // Capture current values to avoid closure issues
    const currentValues = values
    const submitPromise = makeCancelable(onSubmit(currentValues))
    submitPromise.promise
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
    isFormValid: validate ? validate(values) : true,
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
