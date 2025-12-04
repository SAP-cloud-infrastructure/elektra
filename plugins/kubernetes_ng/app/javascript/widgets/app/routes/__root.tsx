import React from "react"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { GardenerApi } from "../apiClient"
import { Breadcrumb } from "../components/Breadcrumb"

export interface RouterContext {
  apiClient: GardenerApi
  region: string
}

export const Root = () => {
  return (
    <AppShell embedded={true}>
      <Breadcrumb />
      <Outlet />
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
