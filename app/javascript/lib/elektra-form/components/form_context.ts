import { createContext } from "react"

export interface FormContextType {
  formValues?: Record<string, any>
  formErrors?: Record<string, string | string[]>
  formName?: string
  onChange?: (name: string, value: unknown) => void
}

export const FormContext = createContext<FormContextType>({})
