import { Button } from "react-bootstrap"
import { FormContext } from "./form_context"
import React, { useContext } from "react"

export const SubmitButton = ({ label = "Save" }) => {
  const context = useContext(FormContext)

  return (
    <Button
      variant="primary"
      type="submit"
      data-test={label}
      disabled={!context.isFormValid || context.isFormSubmitting}
    >
      {context.isFormSubmitting ? "Please Wait ..." : label}
    </Button>
  )
}
