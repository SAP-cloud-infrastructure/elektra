import React, { StrictMode } from "react"
import { AppShellProvider } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { createAppRouter } from "./router"
import styles from "./styles.scss?inline"
import { ErrorBoundary } from "react-error-boundary"
import InlineError from "./components/InlineError"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"

const queryClient = new QueryClient()

interface AppProps {
  basepath: string
  region: string
}

export default function App({ basepath, region }: AppProps) {
  // Pass basepath to router instead of mountpoint - basepath includes the landscape
  const router = createAppRouter(basepath, region)

  return (
    <AppShellProvider theme="theme-light">
      <style>{styles}</style>
      <ErrorBoundary fallback={<InlineError />}>
        <StrictMode>
          <MessagesProvider>
            <QueryClientProvider client={queryClient}>
              <RouterProvider basepath={basepath} context={{}} router={router} />
            </QueryClientProvider>
          </MessagesProvider>
        </StrictMode>
      </ErrorBoundary>
    </AppShellProvider>
  )
}
