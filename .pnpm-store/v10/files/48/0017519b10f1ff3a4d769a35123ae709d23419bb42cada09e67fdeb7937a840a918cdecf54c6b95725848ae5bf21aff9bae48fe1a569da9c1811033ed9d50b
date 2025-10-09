"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const unplugin = require("unplugin");
const config = require("./core/config.cjs");
const routerCodeSplitterPlugin = require("./core/router-code-splitter-plugin.cjs");
const routerGeneratorPlugin = require("./core/router-generator-plugin.cjs");
const routerComposedPlugin = require("./core/router-composed-plugin.cjs");
const TanStackRouterGeneratorRspack = /* @__PURE__ */ unplugin.createRspackPlugin(
  routerGeneratorPlugin.unpluginRouterGeneratorFactory
);
const TanStackRouterCodeSplitterRspack = /* @__PURE__ */ unplugin.createRspackPlugin(
  routerCodeSplitterPlugin.unpluginRouterCodeSplitterFactory
);
const TanStackRouterRspack = /* @__PURE__ */ unplugin.createRspackPlugin(
  routerComposedPlugin.unpluginRouterComposedFactory
);
const tanstackRouter = TanStackRouterRspack;
exports.configSchema = config.configSchema;
exports.TanStackRouterCodeSplitterRspack = TanStackRouterCodeSplitterRspack;
exports.TanStackRouterGeneratorRspack = TanStackRouterGeneratorRspack;
exports.TanStackRouterRspack = TanStackRouterRspack;
exports.default = TanStackRouterRspack;
exports.tanstackRouter = tanstackRouter;
//# sourceMappingURL=rspack.cjs.map
