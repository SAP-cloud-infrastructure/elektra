import { StrictMode } from "react"
import { AppShellProvider } from "@cloudoperators/juno-ui-components"
import { RouterProvider } from "@tanstack/react-router"
import { router } from "./router"
import styles from "./styles.scss?inline"

interface AppProps {
  basePath: string
  domainName: string
  projectName: string
}

export function App({ basePath, domainName, projectName }: AppProps) {
  return (
    <AppShellProvider theme="theme-light">
      <style>{styles}</style>
      <StrictMode>
        <RouterProvider basepath={basePath} context={{ domainName, projectName }} router={router} />
      </StrictMode>
    </AppShellProvider>
  )
}
