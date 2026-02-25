import React from "react"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell } from "@cloudoperators/juno-ui-components"
import { GardenerApi } from "../apiClient"
import { Breadcrumb } from "../components/Breadcrumb"
import { Messages } from "@cloudoperators/juno-messages-provider"

export interface RouterContext {
  apiClient: GardenerApi
  region: string
}

export const Root = () => {
  return (
    <AppShell embedded={true}>
      <Breadcrumb />
      <Messages className="tw-mt-4" />
      <Outlet />
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
