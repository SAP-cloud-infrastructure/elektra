import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  loader: () => redirect({ to: "/clusters" }),
})
