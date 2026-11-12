import { createFileRoute } from "@tanstack/react-router"

// The instance list lives in the layout route (route.tsx) so it stays mounted
// behind the /instances/new and /instances/$id modals. This index route only
// resolves "/instances/" and has nothing extra to show.
export const Route = createFileRoute("/instances/")({
  component: () => null,
})
