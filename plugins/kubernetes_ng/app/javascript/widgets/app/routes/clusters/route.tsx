import { createFileRoute, Outlet } from "@tanstack/react-router"
import { LoaderWithCrumb } from "../-types"

export const CLUSTERS_ROUTE_ID = "/clusters"

export const RouteLoader = async (): Promise<LoaderWithCrumb> => {
  return {
    crumb: {
      label: "Clusters",
      icon: "widgets",
    },
  }
}

export const Route = createFileRoute(CLUSTERS_ROUTE_ID)({
  loader: RouteLoader,
  component: Outlet,
})
