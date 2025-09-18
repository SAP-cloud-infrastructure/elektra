import { createTanstackRouterPlugin } from "../../config/esbuild/esbuild-tanstack-router-plugin.js"

export default [
  createTanstackRouterPlugin({
    routesDirectory: "./plugins/%{PLUGIN_NAME}/app/javascript/widgets/app/routes",
    generatedRouteTree: "./plugins/%{PLUGIN_NAME}/app/javascript/widgets/app/routeTree.gen.ts",
    autoCodeSplitting: true,
  }),
]
