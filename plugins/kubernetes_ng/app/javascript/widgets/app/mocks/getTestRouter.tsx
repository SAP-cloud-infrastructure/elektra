import {
  createRouter,
  createMemoryHistory,
  RouterOptions,
  AnyRoute,
  TrailingSlashOption,
  RouterHistory,
} from "@tanstack/react-router"

interface TestContext {
  apiClient: null
}

type TestRouterOptions<TRouteTree extends AnyRoute> = RouterOptions<
  TRouteTree,
  TrailingSlashOption,
  boolean,
  RouterHistory,
  TestContext
>

export const getTestRouter = <TRouteTree extends AnyRoute>({
  routeTree,
  history = createMemoryHistory(),
}: Pick<TestRouterOptions<TRouteTree>, "routeTree" | "history">) => {
  return createRouter<TRouteTree, TrailingSlashOption, boolean, RouterHistory, TestContext>({
    routeTree,
    history,
    defaultPendingMinMs: 0,
    context: { apiClient: null },
  })
}
