import { createTanstackRouterPlugin } from "../../config/esbuild/esbuild-tanstack-router-plugin.js"

export default [
  createTanstackRouterPlugin({
    routesDirectory: "./plugins/smartops/app/javascript/widgets/app/routes",
    generatedRouteTree: "./plugins/smartops/app/javascript/widgets/app/routeTree.gen.ts",
    autoCodeSplitting: true,
  }),
]
