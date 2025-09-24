import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { gardenerApi } from "./apiClient"

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export const router = createRouter({
  routeTree,
  context: {
    gardenerApi: gardenerApi,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
})
