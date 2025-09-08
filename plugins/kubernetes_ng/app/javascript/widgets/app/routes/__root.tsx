import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { AppShell, Container } from "@cloudoperators/juno-ui-components"
import { type ApiClient } from "../apiClient"

interface RouterContext {
  apiClient?: ApiClient
}

const Root = () => {
  return (
    <AppShell embedded={true}>
      <Container py px>
        <Outlet />
      </Container>
    </AppShell>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
