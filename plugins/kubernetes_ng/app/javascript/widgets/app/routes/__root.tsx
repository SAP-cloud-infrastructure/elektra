import React from "react"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { GardenerApi } from "../apiClient"
import { Breadcrumb } from "../components/Breadcrumb"

interface RouterContext {
  gardenerApi: GardenerApi
}

export const Root = () => {
  return (
    <AppShell embedded={true}>
      <Breadcrumb data-breadcrumb="main" />
      <Outlet />
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
