"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const unplugin = require("unplugin");
const config = require("./core/config.cjs");
const routerCodeSplitterPlugin = require("./core/router-code-splitter-plugin.cjs");
const routerGeneratorPlugin = require("./core/router-generator-plugin.cjs");
const routerComposedPlugin = require("./core/router-composed-plugin.cjs");
const routeAutoimportPlugin = require("./core/route-autoimport-plugin.cjs");
const tanstackRouterAutoImport = unplugin.createVitePlugin(
  routeAutoimportPlugin.unpluginRouteAutoImportFactory
);
const tanstackRouterGenerator = unplugin.createVitePlugin(routerGeneratorPlugin.unpluginRouterGeneratorFactory);
const tanStackRouterCodeSplitter = unplugin.createVitePlugin(
  routerCodeSplitterPlugin.unpluginRouterCodeSplitterFactory
);
const tanstackRouter = unplugin.createVitePlugin(routerComposedPlugin.unpluginRouterComposedFactory);
const TanStackRouterVite = tanstackRouter;
exports.configSchema = config.configSchema;
exports.TanStackRouterVite = TanStackRouterVite;
exports.default = tanstackRouter;
exports.tanStackRouterCodeSplitter = tanStackRouterCodeSplitter;
exports.tanstackRouter = tanstackRouter;
exports.tanstackRouterAutoImport = tanstackRouterAutoImport;
exports.tanstackRouterGenerator = tanstackRouterGenerator;
//# sourceMappingURL=vite.cjs.map
