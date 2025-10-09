import { parseAst, generateFromAst, logDiff } from "@tanstack/router-utils";
import babel from "@babel/core";
import * as template from "@babel/template";
import { getConfig } from "./config.js";
import { debug } from "./utils.js";
const unpluginRouteAutoImportFactory = (options = {}) => {
  let ROOT = process.cwd();
  let userConfig = options;
  return {
    name: "tanstack-router:autoimport",
    enforce: "pre",
    transform: {
      filter: {
        // this is necessary for webpack / rspack to avoid matching .html files
        id: /\.(m|c)?(j|t)sx?$/,
        code: /createFileRoute\(|createLazyFileRoute\(/
      },
      handler(code, id) {
        var _a;
        if (!((_a = globalThis.TSR_ROUTES_BY_ID_MAP) == null ? void 0 : _a.has(id))) {
          return null;
        }
        let routeType;
        if (code.includes("createFileRoute(")) {
          routeType = "createFileRoute";
        } else if (code.includes("createLazyFileRoute(")) {
          routeType = "createLazyFileRoute";
        } else {
          return null;
        }
        const routerImportPath = `@tanstack/${userConfig.target}-router`;
        const ast = parseAst({ code });
        let isCreateRouteFunctionImported = false;
        babel.traverse(ast, {
          Program: {
            enter(programPath) {
              programPath.traverse({
                ImportDeclaration(path) {
                  const importedSpecifiers = path.node.specifiers.map(
                    (specifier) => specifier.local.name
                  );
                  if (importedSpecifiers.includes(routeType) && path.node.source.value === routerImportPath) {
                    isCreateRouteFunctionImported = true;
                  }
                }
              });
            }
          }
        });
        if (!isCreateRouteFunctionImported) {
          if (debug) console.info("Adding autoimports to route ", id);
          const autoImportStatement = template.statement(
            `import { ${routeType} } from '${routerImportPath}'`
          )();
          ast.program.body.unshift(autoImportStatement);
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
        return null;
      }
    },
    vite: {
      configResolved(config) {
        ROOT = config.root;
        userConfig = getConfig(options, ROOT);
      }
    },
    rspack() {
      ROOT = process.cwd();
      userConfig = getConfig(options, ROOT);
    },
    webpack() {
      ROOT = process.cwd();
      userConfig = getConfig(options, ROOT);
    }
  };
};
export {
  unpluginRouteAutoImportFactory
};
//# sourceMappingURL=route-autoimport-plugin.js.map
