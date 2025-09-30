import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { createGardenerApi } from "./apiClient"

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export function createAppRouter(mountpoint: string) {
  const gardenerApi = createGardenerApi(mountpoint)

  return createRouter({
    routeTree,
    context: {
      apiClient: gardenerApi,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}
