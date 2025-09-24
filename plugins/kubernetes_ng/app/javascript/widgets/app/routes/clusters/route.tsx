import { createFileRoute, Outlet } from "@tanstack/react-router"
import { LoaderWithCrumb } from "../-types"

export const Route = createFileRoute("/clusters")({
  loader: (): LoaderWithCrumb => ({
    crumb: {
      label: "Clusters",
      icon: "home",
    },
  }),
  component: Outlet,
})
