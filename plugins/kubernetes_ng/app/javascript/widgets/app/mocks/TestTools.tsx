import {
  createRouter,
  createMemoryHistory,
  AnyRoute,
  RouterHistory,
  createRootRoute,
  createRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router"
import { PortalProvider } from "@cloudoperators/juno-ui-components/index"
import { render } from "@testing-library/react"
import { RouterContext } from "../routes/__root"
import { defaultCluster, permissionsAllTrue, externalNetworks, cloudProfiles } from "./data"
import { GardenerApi } from "../apiClient"

export interface TestContext {
  apiClient: unknown
}

export const getTestRouter = <TRouteTree extends AnyRoute>({
  routeTree,
  context,
  history = createMemoryHistory(),
}: {
  routeTree: TRouteTree
  context?: RouterContext
  history?: RouterHistory
}) => {
  return createRouter({
    routeTree,
    history,
    defaultPendingMinMs: 0,
    context,
  })
}

export function deferredPromise<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export const renderComponent = (component: React.ReactNode, path = "/test/") => {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const router = getTestRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: path,
        component: () => <PortalProvider>{component}</PortalProvider>,
      }),
    ]),
    history: createMemoryHistory({
      initialEntries: [path],
    }),
  })

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

export const defaultMockClient: GardenerApi = {
  gardener: {
    getClusters: () => Promise.resolve([defaultCluster]),
    getClusterByName: () => Promise.resolve(defaultCluster),
    createCluster: () => Promise.resolve(defaultCluster),
    getKubeconfig: () => Promise.resolve("kubeconfig-data"),

    getShootPermissions: () => Promise.resolve(permissionsAllTrue),
    getKubeconfigPermission: () => Promise.resolve(permissionsAllTrue),

    getExternalNetworks: () => Promise.resolve(externalNetworks),
    getCloudProfiles: () => Promise.resolve(cloudProfiles),
  },
}
