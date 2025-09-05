import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export const router = createRouter({
  routeTree,
  context: {
    trpcClient: undefined!,
    auth: undefined!,
    basePath: undefined!,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
})
