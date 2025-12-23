// Remove the /show route file and update your index route
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  loader: () => redirect({ to: "/jobs" }),
})
