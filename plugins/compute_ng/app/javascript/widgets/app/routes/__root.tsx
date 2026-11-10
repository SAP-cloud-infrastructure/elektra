import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { ComputeApi } from "../apiClient"

export interface RouterContext {
  apiClient: ComputeApi
  region: string
  projectid: string
}

export const Root = () => {
  return (
    <AppShell embedded={true}>
      <Outlet />
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
