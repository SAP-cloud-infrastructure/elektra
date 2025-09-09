import { tanstackRouter } from "@tanstack/router-plugin/esbuild"

/**
 * Creates an esbuild plugin for TanStack Router file-based routing.
 *
 * @param {Object} options
 * @param {string} options.routesDirectory - Folder where route pages are located
 * @param {string} options.generatedRouteTree - Path to generate the route tree file
 * @param {boolean} [options.autoCodeSplitting=true] - Whether to enable automatic code splitting
 */
export function createTanstackRouterPlugin({ routesDirectory, generatedRouteTree, autoCodeSplitting = true }) {
  return tanstackRouter({
    routesDirectory,
    generatedRouteTree,
    target: "react",
    autoCodeSplitting,
  })
}
