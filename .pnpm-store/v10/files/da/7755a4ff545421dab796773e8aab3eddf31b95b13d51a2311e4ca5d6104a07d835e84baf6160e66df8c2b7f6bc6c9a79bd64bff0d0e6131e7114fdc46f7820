import { parseAst, generateFromAst, logDiff } from "@tanstack/router-utils";
import { routeHmrStatement } from "./route-hmr-statement.js";
import { debug } from "./utils.js";
import { getConfig } from "./config.js";
const includeCode = [
  "createFileRoute(",
  "createRootRoute(",
  "createRootRouteWithContext("
];
const unpluginRouterHmrFactory = (options = {}) => {
  let ROOT = process.cwd();
  let userConfig = options;
  return {
    name: "tanstack-router:hmr",
    enforce: "pre",
    transform: {
      filter: {
        // this is necessary for webpack / rspack to avoid matching .html files
        id: /\.(m|c)?(j|t)sx?$/,
        code: {
          include: includeCode
        }
      },
      handler(code, id) {
        var _a;
        if (!((_a = globalThis.TSR_ROUTES_BY_ID_MAP) == null ? void 0 : _a.has(id))) {
          return null;
        }
        if (debug) console.info("Adding HMR handling to route ", id);
        const ast = parseAst({ code });
        ast.program.body.push(routeHmrStatement);
        const result = generateFromAst(ast, {
          sourceMaps: true,
          filename: id,
          sourceFileName: id
        });
        if (debug) {
          logDiff(code, result.code);
          console.log("Output:\n", result.code + "\n\n");
        }
        return result;
      }
    },
    vite: {
      configResolved(config) {
        ROOT = config.root;
        userConfig = getConfig(options, ROOT);
      },
      applyToEnvironment(environment) {
        var _a, _b;
        if ((_b = (_a = userConfig.plugin) == null ? void 0 : _a.vite) == null ? void 0 : _b.environmentName) {
          return userConfig.plugin.vite.environmentName === environment.name;
        }
        return true;
      }
    }
  };
};
export {
  unpluginRouterHmrFactory
};
//# sourceMappingURL=router-hmr-plugin.js.map
