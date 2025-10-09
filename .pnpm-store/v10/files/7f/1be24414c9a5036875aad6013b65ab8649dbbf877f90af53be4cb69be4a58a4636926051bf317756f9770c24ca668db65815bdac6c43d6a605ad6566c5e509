"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const unplugin = require("unplugin");
const config = require("./core/config.cjs");
const routerCodeSplitterPlugin = require("./core/router-code-splitter-plugin.cjs");
const routerGeneratorPlugin = require("./core/router-generator-plugin.cjs");
const routerComposedPlugin = require("./core/router-composed-plugin.cjs");
const TanStackRouterGeneratorWebpack = /* @__PURE__ */ unplugin.createWebpackPlugin(
  routerGeneratorPlugin.unpluginRouterGeneratorFactory
);
const TanStackRouterCodeSplitterWebpack = /* @__PURE__ */ unplugin.createWebpackPlugin(
  routerCodeSplitterPlugin.unpluginRouterCodeSplitterFactory
);
const TanStackRouterWebpack = /* @__PURE__ */ unplugin.createWebpackPlugin(
  routerComposedPlugin.unpluginRouterComposedFactory
);
const tanstackRouter = TanStackRouterWebpack;
exports.configSchema = config.configSchema;
exports.TanStackRouterCodeSplitterWebpack = TanStackRouterCodeSplitterWebpack;
exports.TanStackRouterGeneratorWebpack = TanStackRouterGeneratorWebpack;
exports.TanStackRouterWebpack = TanStackRouterWebpack;
exports.default = TanStackRouterWebpack;
exports.tanstackRouter = tanstackRouter;
//# sourceMappingURL=webpack.cjs.map
