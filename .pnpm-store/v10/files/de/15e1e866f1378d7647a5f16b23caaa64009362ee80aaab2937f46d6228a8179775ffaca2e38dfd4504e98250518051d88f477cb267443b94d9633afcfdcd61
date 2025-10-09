"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_url = require("node:url");
const routerUtils = require("@tanstack/router-utils");
const config = require("./config.cjs");
const compilers = require("./code-splitter/compilers.cjs");
const constants = require("./constants.cjs");
const pathIds = require("./code-splitter/path-ids.cjs");
const utils = require("./utils.cjs");
const bannedBeforeExternalPlugins = [
  {
    identifier: "@react-refresh",
    pkg: "@vitejs/plugin-react",
    usage: "viteReact()",
    frameworks: ["vite"]
  }
];
class FoundPluginInBeforeCode extends Error {
  constructor(externalPlugin, pluginFramework) {
    super(`We detected that the '${externalPlugin.pkg}' was passed before '@tanstack/router-plugin/${pluginFramework}'. Please make sure that '@tanstack/router-plugin' is passed before '${externalPlugin.pkg}' and try again: 
e.g.
plugins: [
  tanstackRouter(), // Place this before ${externalPlugin.usage}
  ${externalPlugin.usage},
]
`);
  }
}
const PLUGIN_NAME = "unplugin:router-code-splitter";
const unpluginRouterCodeSplitterFactory = (options = {}, { framework }) => {
  let ROOT = process.cwd();
  let userConfig = options;
  const isProduction = process.env.NODE_ENV === "production";
  const getGlobalCodeSplitGroupings = () => {
    var _a;
    return ((_a = userConfig.codeSplittingOptions) == null ? void 0 : _a.defaultBehavior) || constants.defaultCodeSplitGroupings;
  };
  const getShouldSplitFn = () => {
    var _a;
    return (_a = userConfig.codeSplittingOptions) == null ? void 0 : _a.splitBehavior;
  };
  const handleCompilingReferenceFile = (code, id, generatorNodeInfo) => {
    var _a, _b;
    if (utils.debug) console.info("Compiling Route: ", id);
    const fromCode = compilers.detectCodeSplitGroupingsFromRoute({
      code
    });
    if (fromCode.groupings) {
      const res = config.splitGroupingsSchema.safeParse(fromCode.groupings);
      if (!res.success) {
        const message = res.error.errors.map((e) => e.message).join(". ");
        throw new Error(
          `The groupings for the route "${id}" are invalid.
${message}`
        );
      }
    }
    const userShouldSplitFn = getShouldSplitFn();
    const pluginSplitBehavior = userShouldSplitFn == null ? void 0 : userShouldSplitFn({
      routeId: generatorNodeInfo.routePath
    });
    if (pluginSplitBehavior) {
      const res = config.splitGroupingsSchema.safeParse(pluginSplitBehavior);
      if (!res.success) {
        const message = res.error.errors.map((e) => e.message).join(". ");
        throw new Error(
          `The groupings returned when using \`splitBehavior\` for the route "${id}" are invalid.
${message}`
        );
      }
    }
    const splitGroupings = fromCode.groupings || pluginSplitBehavior || getGlobalCodeSplitGroupings();
    const compiledReferenceRoute = compilers.compileCodeSplitReferenceRoute({
      code,
      codeSplitGroupings: splitGroupings,
      targetFramework: userConfig.target,
      filename: id,
      id,
      deleteNodes: new Set((_a = userConfig.codeSplittingOptions) == null ? void 0 : _a.deleteNodes),
      addHmr: (((_b = options.codeSplittingOptions) == null ? void 0 : _b.addHmr) ?? true) && !isProduction
    });
    if (utils.debug) {
      routerUtils.logDiff(code, compiledReferenceRoute.code);
      console.log("Output:\n", compiledReferenceRoute.code + "\n\n");
    }
    return compiledReferenceRoute;
  };
  const handleCompilingVirtualFile = (code, id) => {
    if (utils.debug) console.info("Splitting Route: ", id);
    const [_, ...pathnameParts] = id.split("?");
    const searchParams = new URLSearchParams(pathnameParts.join("?"));
    const splitValue = searchParams.get(constants.tsrSplit);
    if (!splitValue) {
      throw new Error(
        `The split value for the virtual route "${id}" was not found.`
      );
    }
    const rawGrouping = pathIds.decodeIdentifier(splitValue);
    const grouping = [...new Set(rawGrouping)].filter(
      (p) => constants.splitRouteIdentNodes.includes(p)
    );
    const result = compilers.compileCodeSplitVirtualRoute({
      code,
      filename: id,
      splitTargets: grouping
    });
    if (utils.debug) {
      routerUtils.logDiff(code, result.code);
      console.log("Output:\n", result.code + "\n\n");
    }
    return result;
  };
  const includedCode = [
    "createFileRoute(",
    "createRootRoute(",
    "createRootRouteWithContext("
  ];
  return [
    {
      name: "tanstack-router:code-splitter:compile-reference-file",
      enforce: "pre",
      transform: {
        filter: {
          id: {
            exclude: constants.tsrSplit,
            // this is necessary for webpack / rspack to avoid matching .html files
            include: /\.(m|c)?(j|t)sx?$/
          },
          code: {
            include: includedCode
          }
        },
        handler(code, id) {
          var _a;
          const generatorFileInfo = (_a = globalThis.TSR_ROUTES_BY_ID_MAP) == null ? void 0 : _a.get(id);
          if (generatorFileInfo && includedCode.some((included) => code.includes(included))) {
            for (const externalPlugin of bannedBeforeExternalPlugins) {
              if (!externalPlugin.frameworks.includes(framework)) {
                continue;
              }
              if (code.includes(externalPlugin.identifier)) {
                throw new FoundPluginInBeforeCode(externalPlugin, framework);
              }
            }
            return handleCompilingReferenceFile(code, id, generatorFileInfo);
          }
          return null;
        }
      },
      vite: {
        configResolved(config$1) {
          ROOT = config$1.root;
          userConfig = config.getConfig(options, ROOT);
        },
        applyToEnvironment(environment) {
          var _a, _b;
          if ((_b = (_a = userConfig.plugin) == null ? void 0 : _a.vite) == null ? void 0 : _b.environmentName) {
            return userConfig.plugin.vite.environmentName === environment.name;
          }
          return true;
        }
      },
      rspack() {
        ROOT = process.cwd();
        userConfig = config.getConfig(options, ROOT);
      },
      webpack(compiler) {
        ROOT = process.cwd();
        userConfig = config.getConfig(options, ROOT);
        if (compiler.options.mode === "production") {
          compiler.hooks.done.tap(PLUGIN_NAME, () => {
            console.info("✅ " + PLUGIN_NAME + ": code-splitting done!");
            setTimeout(() => {
              process.exit(0);
            });
          });
        }
      }
    },
    {
      name: "tanstack-router:code-splitter:compile-virtual-file",
      enforce: "pre",
      transform: {
        filter: {
          id: /tsr-split/
        },
        handler(code, id) {
          const url = node_url.pathToFileURL(id);
          url.searchParams.delete("v");
          id = node_url.fileURLToPath(url).replace(/\\/g, "/");
          return handleCompilingVirtualFile(code, id);
        }
      }
    }
  ];
};
exports.unpluginRouterCodeSplitterFactory = unpluginRouterCodeSplitterFactory;
//# sourceMappingURL=router-code-splitter-plugin.cjs.map
