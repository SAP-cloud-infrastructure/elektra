import { FormInput } from "./components/form_input"
import { FormMultiselect } from "./components/form_multiselect"
import { FormElement, FormElementHorizontal, FormElementInline } from "./components/form_element"
import { FormErrors } from "./components/form_errors"
import { SubmitButton } from "./components/submit_button"
import { ErrorsList } from "./components/errors_list"
import FormComponent, { FormProps, FormValues } from "./components/form"
import { FormContext } from "./components/form_context"
import { FC } from "react"

interface FormCompoundComponent extends FC<FormProps> {
  Element: typeof FormElement
  ElementHorizontal: typeof FormElementHorizontal
  ElementInline: typeof FormElementInline
  Input: typeof FormInput
  Errors: typeof FormErrors
  SubmitButton: typeof SubmitButton
  FormMultiselect: typeof FormMultiselect
  Context: typeof FormContext
}
const Form = FormComponent as FormCompoundComponent

Form.Element = FormElement
Form.ElementHorizontal = FormElementHorizontal
Form.ElementInline = FormElementInline
Form.Input = FormInput
Form.Errors = FormErrors
Form.SubmitButton = SubmitButton
Form.FormMultiselect = FormMultiselect
Form.Context = FormContext

export { Form, ErrorsList, FormValues }
