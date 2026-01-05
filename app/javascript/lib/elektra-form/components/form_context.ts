import { createContext } from "react"

export interface FormContextType {
  formValues?: Record<string, unknown>
  formErrors?: Record<string, string | string[]> | null
  formName?: string
  onChange?: (name: string, value: unknown) => void
}

export const FormContext = createContext<FormContextType>({})
