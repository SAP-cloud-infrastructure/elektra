import { normalize, join, isAbsolute } from "node:path";
import { Generator, resolveConfigPath } from "@tanstack/router-generator";
import { getConfig } from "./config.js";
const PLUGIN_NAME = "unplugin:router-generator";
const unpluginRouterGeneratorFactory = (options = {}) => {
  const ROOT = process.cwd();
  let userConfig = options;
  let generator;
  const routeGenerationDisabled = () => userConfig.enableRouteGeneration === false;
  const getRoutesDirectoryPath = () => {
    return isAbsolute(userConfig.routesDirectory) ? userConfig.routesDirectory : join(ROOT, userConfig.routesDirectory);
  };
  const initConfigAndGenerator = () => {
    userConfig = getConfig(options, ROOT);
    generator = new Generator({
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
      const filePath = normalize(opts.file);
      if (filePath === resolveConfigPath({ configDirectory: ROOT })) {
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
export {
  unpluginRouterGeneratorFactory
};
//# sourceMappingURL=router-generator-plugin.js.map
