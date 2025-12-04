import { LoaderWithCrumb } from "../-types"

// Note: The RouteLoader was moved to a separate file (routeLoader.ts) to resolve the warning:
// "These exports from 'app/routes/clusters/route.tsx?tsr-split=component' are not being code-split and will increase your bundle size."
// TanStack Router automatically code-splits route files, so any extra exports (like loaders or utils)
// should live outside the route file to avoid increasing the bundle size.
export const RouteLoader = async (): Promise<LoaderWithCrumb> => {
  return {
    crumb: {
      label: "Clusters",
      icon: "widgets",
    },
  }
}
