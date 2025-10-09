"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const routerGenerator = require("@tanstack/router-generator");
const routerGeneratorPlugin = require("./router-generator-plugin.cjs");
const routerCodeSplitterPlugin = require("./router-code-splitter-plugin.cjs");
const routerHmrPlugin = require("./router-hmr-plugin.cjs");
const routeAutoimportPlugin = require("./route-autoimport-plugin.cjs");
const unpluginRouterComposedFactory = (options = {}, meta) => {
  const ROOT = process.cwd();
  const userConfig = routerGenerator.getConfig(options, ROOT);
  const getPlugin = (pluginFactory) => {
    const plugin = pluginFactory(options, meta);
    if (!Array.isArray(plugin)) {
      return [plugin];
    }
    return plugin;
  };
  const routerGenerator$1 = getPlugin(routerGeneratorPlugin.unpluginRouterGeneratorFactory);
  const routerCodeSplitter = getPlugin(routerCodeSplitterPlugin.unpluginRouterCodeSplitterFactory);
  const routeAutoImport = getPlugin(routeAutoimportPlugin.unpluginRouteAutoImportFactory);
  const result = [...routerGenerator$1];
  if (userConfig.autoCodeSplitting) {
    result.push(...routerCodeSplitter);
  }
  if (userConfig.verboseFileRoutes === false) {
    result.push(...routeAutoImport);
  }
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction && !userConfig.autoCodeSplitting) {
    const routerHmr = getPlugin(routerHmrPlugin.unpluginRouterHmrFactory);
    result.push(...routerHmr);
  }
  return result;
};
exports.unpluginRouterComposedFactory = unpluginRouterComposedFactory;
//# sourceMappingURL=router-composed-plugin.cjs.map
