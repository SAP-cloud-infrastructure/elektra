import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { ApiClient } from "../apiClient"

interface RouterContext {
  apiClient?: ApiClient
  domainName?: string
  projectName?: string
}

export const Root = () => {
  return (
    <AppShell embedded={true}>
      <Outlet />
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
