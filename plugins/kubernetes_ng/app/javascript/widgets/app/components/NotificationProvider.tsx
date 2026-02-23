import React, { createContext, useContext, useState, useCallback } from "react"
import { Container, Message } from "@cloudoperators/juno-ui-components"
import { normalizeError } from "./InlineError"

interface NotificationContextType {
  showSuccess: (message: string) => void
  showError: (error: Error | string) => void
  clearSuccessNotification: () => void
  clearErrorNotification: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message)
  }, [])

  const showError = useCallback((error: Error | string) => {
    const errorText = typeof error === "string" ? error : normalizeError(error).title + normalizeError(error).message
    setErrorMessage(errorText)
  }, [])

  const clearNotifications = useCallback(() => {
    setSuccessMessage(null)
    setErrorMessage(null)
  }, [])

  const clearSuccessNotification = useCallback(() => {
    setSuccessMessage(null)
  }, [])

  const clearErrorNotification = useCallback(() => {
    setErrorMessage(null)
  }, [])

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, clearNotifications, clearSuccessNotification, clearErrorNotification }}
    >
      {successMessage && (
        <Container px={false} py>
          <Message text={successMessage} variant="success" onDismiss={() => setSuccessMessage(null)} dismissible />
        </Container>
      )}
      {errorMessage && (
        <Container px={false} py>
          <Message text={errorMessage} variant="error" onDismiss={() => setErrorMessage(null)} />
        </Container>
      )}
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider")
  }
  return context
}
