import { createTanstackRouterPlugin } from "../../config/esbuild/esbuild-tanstack-router-plugin.js"

export default [
  createTanstackRouterPlugin({
    routesDirectory: "./plugins/kubernetes_ng/app/javascript/widgets/app/routes",
    generatedRouteTree: "./plugins/kubernetes_ng/app/javascript/widgets/app/routeTree.gen.ts",
    autoCodeSplitting: true,
  }),
]
