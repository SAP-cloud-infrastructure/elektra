import { createFileRoute } from "@tanstack/react-router"

// The instance list lives in the layout route (route.tsx) so it stays mounted
// behind the /instances/new modal. This index route only resolves "/instances/".
export const Route = createFileRoute("/instances/")({
  component: () => null,
})
