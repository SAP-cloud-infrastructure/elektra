import { createTanstackRouterPlugin } from "../../config/esbuild/esbuild-tanstack-router-plugin.js"

export default [
  createTanstackRouterPlugin({
    routesDirectory: "./plugins/compute_njq/app/javascript/widgets/app/routes",
    generatedRouteTree: "./plugins/compute_njq/app/javascript/widgets/app/routeTree.gen.ts",
    autoCodeSplitting: true,
  }),
]
