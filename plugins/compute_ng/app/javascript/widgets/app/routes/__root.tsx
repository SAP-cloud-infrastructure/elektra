import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { ComputeApi } from "../apiClient"

export interface RouterContext {
  apiClient: ComputeApi
  region: string
  projectid: string
}

export const Root = () => {
  return (
    <div className="compute-ng">
      <Outlet />
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root })
