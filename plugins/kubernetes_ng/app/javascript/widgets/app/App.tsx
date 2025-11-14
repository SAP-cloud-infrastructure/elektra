import React, { StrictMode } from "react"
import { AppShellProvider } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { createAppRouter } from "./router"
import styles from "./styles.scss?inline"
import { ErrorBoundary } from "react-error-boundary"
import InlineError from "./components/InlineError"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

interface AppProps {
  basepath: string
  mountpoint: string
}

export default function App({ basepath, mountpoint }: AppProps) {
  const router = createAppRouter(mountpoint)

  return (
    <AppShellProvider theme="theme-light">
      <style>{styles}</style>
      <ErrorBoundary fallback={<InlineError />}>
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <RouterProvider basepath={basepath} context={{}} router={router} />
          </QueryClientProvider>
        </StrictMode>
      </ErrorBoundary>
    </AppShellProvider>
  )
}
