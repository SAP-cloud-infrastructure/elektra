import React from "react"
import { StrictMode } from "react"
import { AppShellProvider } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "./router"
import styles from "./styles.scss?inline"

interface AppProps {
  basePath: string
}

export function App({ basePath }: AppProps) {
  return (
    <>
      <AppShellProvider theme="theme-light">
        <style>{styles}</style>
        <StrictMode>
          <RouterProvider basepath={basePath} context={{}} router={router} />
        </StrictMode>
      </AppShellProvider>
    </>
  )
}
