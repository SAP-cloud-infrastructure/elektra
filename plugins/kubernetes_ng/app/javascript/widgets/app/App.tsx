import React, { StrictMode } from "react"
import { AppShellProvider } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { createAppRouter } from "./router"
import styles from "./styles.scss?inline"

interface AppProps {
  basepath: string
  mountpoint: string
}

export default function App(props: AppProps) {
  const router = createAppRouter(props.mountpoint)

  return (
    <AppShellProvider theme="theme-light">
      <style>{styles}</style>
      <StrictMode>
        <RouterProvider basepath={props.basepath} context={{}} router={router} />
      </StrictMode>
    </AppShellProvider>
  )
}
