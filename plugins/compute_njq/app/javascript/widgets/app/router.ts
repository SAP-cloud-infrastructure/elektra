import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { createComputeApi } from "./apiClient"

// Register the router instance for type safety.
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

export function createAppRouter(basepath: string, region: string, projectid: string) {
  const apiClient = createComputeApi(basepath)

  return createRouter({
    routeTree,
    context: {
      apiClient,
      region,
      projectid,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}
