import { getConfig } from "@tanstack/router-generator";
import { unpluginRouterGeneratorFactory } from "./router-generator-plugin.js";
import { unpluginRouterCodeSplitterFactory } from "./router-code-splitter-plugin.js";
import { unpluginRouterHmrFactory } from "./router-hmr-plugin.js";
import { unpluginRouteAutoImportFactory } from "./route-autoimport-plugin.js";
const unpluginRouterComposedFactory = (options = {}, meta) => {
  const ROOT = process.cwd();
  const userConfig = getConfig(options, ROOT);
  const getPlugin = (pluginFactory) => {
    const plugin = pluginFactory(options, meta);
    if (!Array.isArray(plugin)) {
      return [plugin];
    }
    return plugin;
  };
  const routerGenerator = getPlugin(unpluginRouterGeneratorFactory);
  const routerCodeSplitter = getPlugin(unpluginRouterCodeSplitterFactory);
  const routeAutoImport = getPlugin(unpluginRouteAutoImportFactory);
  const result = [...routerGenerator];
  if (userConfig.autoCodeSplitting) {
    result.push(...routerCodeSplitter);
  }
  if (userConfig.verboseFileRoutes === false) {
    result.push(...routeAutoImport);
  }
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction && !userConfig.autoCodeSplitting) {
    const routerHmr = getPlugin(unpluginRouterHmrFactory);
    result.push(...routerHmr);
  }
  return result;
};
export {
  unpluginRouterComposedFactory
};
//# sourceMappingURL=router-composed-plugin.js.map
