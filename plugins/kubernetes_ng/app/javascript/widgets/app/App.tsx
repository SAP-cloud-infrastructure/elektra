import React, { StrictMode } from "react"
import { AppShellProvider } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { createAppRouter } from "./router"
import styles from "./styles.scss?inline"

interface AppProps {
  basepath: string
  mountpoint: string
}

export default function App({ basepath, mountpoint }: AppProps) {
  const router = createAppRouter(mountpoint)

  return (
    <AppShellProvider theme="theme-light">
      <style>{styles}</style>
      <StrictMode>
        <RouterProvider basepath={basepath} context={{}} router={router} />
      </StrictMode>
    </AppShellProvider>
  )
}
