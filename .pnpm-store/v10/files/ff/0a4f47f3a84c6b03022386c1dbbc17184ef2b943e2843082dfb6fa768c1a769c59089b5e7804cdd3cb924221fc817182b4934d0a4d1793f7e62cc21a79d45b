"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_path = require("node:path");
const routerGenerator = require("@tanstack/router-generator");
const config = require("./config.cjs");
const PLUGIN_NAME = "unplugin:router-generator";
const unpluginRouterGeneratorFactory = (options = {}) => {
  const ROOT = process.cwd();
  let userConfig = options;
  let generator;
  const routeGenerationDisabled = () => userConfig.enableRouteGeneration === false;
  const getRoutesDirectoryPath = () => {
    return node_path.isAbsolute(userConfig.routesDirectory) ? userConfig.routesDirectory : node_path.join(ROOT, userConfig.routesDirectory);
  };
  const initConfigAndGenerator = () => {
    userConfig = config.getConfig(options, ROOT);
    generator = new routerGenerator.Generator({
      config: userConfig,
      root: ROOT
    });
  };
  const generate = async (opts) => {
    if (routeGenerationDisabled()) {
      return;
    }
    let generatorEvent = void 0;
    if (opts) {
      const filePath = node_path.normalize(opts.file);
      if (filePath === routerGenerator.resolveConfigPath({ configDirectory: ROOT })) {
        initConfigAndGenerator();
        return;
      }
      generatorEvent = { path: filePath, type: opts.event };
    }
    try {
      await generator.run(generatorEvent);
      globalThis.TSR_ROUTES_BY_ID_MAP = generator.getRoutesByFileMap();
    } catch (e) {
      console.error(e);
    }
  };
  return {
    name: "tanstack:router-generator",
    enforce: "pre",
    async watchChange(id, { event }) {
      await generate({
        file: id,
        event
      });
    },
    async buildStart() {
      await generate();
    },
    vite: {
      configResolved() {
        initConfigAndGenerator();
      },
      applyToEnvironment(environment) {
        var _a, _b;
        if ((_b = (_a = userConfig.plugin) == null ? void 0 : _a.vite) == null ? void 0 : _b.environmentName) {
          return userConfig.plugin.vite.environmentName === environment.name;
        }
        return true;
      },
      async buildStart() {
        await generate();
      },
      sharedDuringBuild: true
    },
    rspack(compiler) {
      initConfigAndGenerator();
      let handle = null;
      compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, () => generate());
      compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, async () => {
        if (handle) {
          return;
        }
        const routesDirectoryPath = getRoutesDirectoryPath();
        const chokidar = await import("chokidar");
        handle = chokidar.watch(routesDirectoryPath, { ignoreInitial: true }).on("add", (file) => generate({ file, event: "create" }));
        await generate();
      });
      compiler.hooks.watchClose.tap(PLUGIN_NAME, async () => {
        if (handle) {
          await handle.close();
        }
      });
    },
    webpack(compiler) {
      initConfigAndGenerator();
      let handle = null;
      compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, () => generate());
      compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, async () => {
        if (handle) {
          return;
        }
        const routesDirectoryPath = getRoutesDirectoryPath();
        const chokidar = await import("chokidar");
        handle = chokidar.watch(routesDirectoryPath, { ignoreInitial: true }).on("add", (file) => generate({ file, event: "create" }));
        await generate();
      });
      compiler.hooks.watchClose.tap(PLUGIN_NAME, async () => {
        if (handle) {
          await handle.close();
        }
      });
      compiler.hooks.done.tap(PLUGIN_NAME, () => {
        console.info("✅ " + PLUGIN_NAME + ": route-tree generation done");
      });
    },
    esbuild: {
      config() {
        initConfigAndGenerator();
      }
    }
  };
};
exports.unpluginRouterGeneratorFactory = unpluginRouterGeneratorFactory;
//# sourceMappingURL=router-generator-plugin.cjs.map
