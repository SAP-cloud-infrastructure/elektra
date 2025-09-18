import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { ApiClient } from "../apiClient"
import React from "react"

interface RouterContext {
  apiClient?: ApiClient
}

export const Root = () => {
  return (
    <AppShell embedded={true}>
      {"Welcome to %{PLUGIN_NAME_HUMANIZE}"}
      <Outlet />
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
