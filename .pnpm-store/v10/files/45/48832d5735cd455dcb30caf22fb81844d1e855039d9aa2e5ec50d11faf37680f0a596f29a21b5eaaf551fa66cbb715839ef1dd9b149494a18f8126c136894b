"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const unplugin = require("unplugin");
const config = require("./core/config.cjs");
const routerCodeSplitterPlugin = require("./core/router-code-splitter-plugin.cjs");
const routerGeneratorPlugin = require("./core/router-generator-plugin.cjs");
const routerComposedPlugin = require("./core/router-composed-plugin.cjs");
const TanStackRouterGeneratorEsbuild = unplugin.createEsbuildPlugin(
  routerGeneratorPlugin.unpluginRouterGeneratorFactory
);
const TanStackRouterCodeSplitterEsbuild = unplugin.createEsbuildPlugin(
  routerCodeSplitterPlugin.unpluginRouterCodeSplitterFactory
);
const TanStackRouterEsbuild = unplugin.createEsbuildPlugin(routerComposedPlugin.unpluginRouterComposedFactory);
const tanstackRouter = TanStackRouterEsbuild;
exports.configSchema = config.configSchema;
exports.TanStackRouterCodeSplitterEsbuild = TanStackRouterCodeSplitterEsbuild;
exports.TanStackRouterEsbuild = TanStackRouterEsbuild;
exports.TanStackRouterGeneratorEsbuild = TanStackRouterGeneratorEsbuild;
exports.default = TanStackRouterEsbuild;
exports.tanstackRouter = tanstackRouter;
//# sourceMappingURL=esbuild.cjs.map
