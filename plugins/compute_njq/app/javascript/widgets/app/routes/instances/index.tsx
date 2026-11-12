import { createFileRoute } from "@tanstack/react-router"

// The list itself is rendered by the /instances layout route; the index route
// has nothing extra to show (no detail modal open).
export const Route = createFileRoute("/instances/")({
  component: () => null,
})
