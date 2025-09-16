import React from "react"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell, Container } from "@cloudoperators/juno-ui-components"
import { ApiClient } from "../apiClient"
import { Breadcrumb } from "../components/Breadcrumb"

interface RouterContext {
  apiClient?: ApiClient
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
