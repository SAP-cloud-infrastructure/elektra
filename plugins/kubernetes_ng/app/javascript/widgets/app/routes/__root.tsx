import { createRootRoute, Outlet } from "@tanstack/react-router"
import { AppShell, Container } from "@cloudoperators/juno-ui-components"

export const Route = createRootRoute({ component: Root })

const Root = () => {
  return (
    <AppShell>
      <Container py px>
        <Outlet />
      </Container>
    </AppShell>
  )
}
