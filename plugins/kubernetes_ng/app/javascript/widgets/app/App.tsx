import React, { StrictMode } from "react"
import { AppShellProvider, AppShell } from "@cloudoperators/juno-ui-components"
import { RouterProvider, createHashHistory, createBrowserHistory } from "@tanstack/react-router"
import { router } from "./router"
import styles from "./styles.scss?inline"

const rootElement = document.getElementById("kubernetes_ng_app_widget")

export default function App() {
  const basePath = rootElement?.dataset.basepath || "/"

  return (
    <>
      <AppShellProvider theme="theme-light">
        <style>{styles}</style>
        <AppShell embedded={true}>
          <StrictMode>
            <RouterProvider basepath={basePath} context={{}} router={router} />
          </StrictMode>
        </AppShell>
      </AppShellProvider>
    </>
  )
}
