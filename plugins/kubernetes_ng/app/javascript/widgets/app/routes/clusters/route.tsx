import { createFileRoute, Outlet } from "@tanstack/react-router"
import { RouteLoader } from "./-routeLoader"

export const CLUSTERS_ROUTE_ID = "/clusters"

export const Route = createFileRoute(CLUSTERS_ROUTE_ID)({
  loader: RouteLoader,
  component: Outlet,
})
