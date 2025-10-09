import { createRspackPlugin } from "unplugin";
import { configSchema } from "./core/config.js";
import { unpluginRouterCodeSplitterFactory } from "./core/router-code-splitter-plugin.js";
import { unpluginRouterGeneratorFactory } from "./core/router-generator-plugin.js";
import { unpluginRouterComposedFactory } from "./core/router-composed-plugin.js";
const TanStackRouterGeneratorRspack = /* @__PURE__ */ createRspackPlugin(
  unpluginRouterGeneratorFactory
);
const TanStackRouterCodeSplitterRspack = /* @__PURE__ */ createRspackPlugin(
  unpluginRouterCodeSplitterFactory
);
const TanStackRouterRspack = /* @__PURE__ */ createRspackPlugin(
  unpluginRouterComposedFactory
);
const tanstackRouter = TanStackRouterRspack;
export {
  TanStackRouterCodeSplitterRspack,
  TanStackRouterGeneratorRspack,
  TanStackRouterRspack,
  configSchema,
  TanStackRouterRspack as default,
  tanstackRouter
};
//# sourceMappingURL=rspack.js.map
