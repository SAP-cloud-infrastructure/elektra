import { createWebpackPlugin } from "unplugin";
import { configSchema } from "./core/config.js";
import { unpluginRouterCodeSplitterFactory } from "./core/router-code-splitter-plugin.js";
import { unpluginRouterGeneratorFactory } from "./core/router-generator-plugin.js";
import { unpluginRouterComposedFactory } from "./core/router-composed-plugin.js";
const TanStackRouterGeneratorWebpack = /* @__PURE__ */ createWebpackPlugin(
  unpluginRouterGeneratorFactory
);
const TanStackRouterCodeSplitterWebpack = /* @__PURE__ */ createWebpackPlugin(
  unpluginRouterCodeSplitterFactory
);
const TanStackRouterWebpack = /* @__PURE__ */ createWebpackPlugin(
  unpluginRouterComposedFactory
);
const tanstackRouter = TanStackRouterWebpack;
export {
  TanStackRouterCodeSplitterWebpack,
  TanStackRouterGeneratorWebpack,
  TanStackRouterWebpack,
  configSchema,
  TanStackRouterWebpack as default,
  tanstackRouter
};
//# sourceMappingURL=webpack.js.map
