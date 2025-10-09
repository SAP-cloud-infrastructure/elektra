import { createVitePlugin } from "unplugin";
import { configSchema } from "./core/config.js";
import { unpluginRouterCodeSplitterFactory } from "./core/router-code-splitter-plugin.js";
import { unpluginRouterGeneratorFactory } from "./core/router-generator-plugin.js";
import { unpluginRouterComposedFactory } from "./core/router-composed-plugin.js";
import { unpluginRouteAutoImportFactory } from "./core/route-autoimport-plugin.js";
const tanstackRouterAutoImport = createVitePlugin(
  unpluginRouteAutoImportFactory
);
const tanstackRouterGenerator = createVitePlugin(unpluginRouterGeneratorFactory);
const tanStackRouterCodeSplitter = createVitePlugin(
  unpluginRouterCodeSplitterFactory
);
const tanstackRouter = createVitePlugin(unpluginRouterComposedFactory);
const TanStackRouterVite = tanstackRouter;
export {
  TanStackRouterVite,
  configSchema,
  tanstackRouter as default,
  tanStackRouterCodeSplitter,
  tanstackRouter,
  tanstackRouterAutoImport,
  tanstackRouterGenerator
};
//# sourceMappingURL=vite.js.map
