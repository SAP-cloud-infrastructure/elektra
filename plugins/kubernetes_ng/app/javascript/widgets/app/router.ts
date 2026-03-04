import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { createGardenerApi } from "./apiClient"

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
  interface HistoryState {
    successMessage?: string
  }
}

export function createAppRouter(basepath: string, region: string) {
  // Use basepath which includes the landscape (e.g., /kubernetes-gardener/prod)
  const gardenerApi = createGardenerApi(basepath)

  return createRouter({
    routeTree,
    context: {
      apiClient: gardenerApi,
      region,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}
