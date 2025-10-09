"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const path = require("node:path");
const node_fs = require("node:fs");
const zod = require("zod");
const config = require("./filesystem/virtual/config.cjs");
const baseConfigSchema = zod.z.object({
  target: zod.z.enum(["react", "solid"]).optional().default("react"),
  virtualRouteConfig: config.virtualRootRouteSchema.or(zod.z.string()).optional(),
  routeFilePrefix: zod.z.string().optional(),
  routeFileIgnorePrefix: zod.z.string().optional().default("-"),
  routeFileIgnorePattern: zod.z.string().optional(),
  routesDirectory: zod.z.string().optional().default("./src/routes"),
  quoteStyle: zod.z.enum(["single", "double"]).optional().default("single"),
  semicolons: zod.z.boolean().optional().default(false),
  disableLogging: zod.z.boolean().optional().default(false),
  routeTreeFileHeader: zod.z.array(zod.z.string()).optional().default([
    "/* eslint-disable */",
    "// @ts-nocheck",
    "// noinspection JSUnusedGlobalSymbols"
  ]),
  indexToken: zod.z.string().optional().default("index"),
  routeToken: zod.z.string().optional().default("route"),
  pathParamsAllowedCharacters: zod.z.array(zod.z.enum([";", ":", "@", "&", "=", "+", "$", ","])).optional()
});
const configSchema = baseConfigSchema.extend({
  generatedRouteTree: zod.z.string().optional().default("./src/routeTree.gen.ts"),
  disableTypes: zod.z.boolean().optional().default(false),
  verboseFileRoutes: zod.z.boolean().optional(),
  addExtensions: zod.z.boolean().optional().default(false),
  enableRouteTreeFormatting: zod.z.boolean().optional().default(true),
  routeTreeFileFooter: zod.z.array(zod.z.string()).optional().default([]),
  autoCodeSplitting: zod.z.boolean().optional(),
  customScaffolding: zod.z.object({
    routeTemplate: zod.z.string().optional(),
    lazyRouteTemplate: zod.z.string().optional()
  }).optional(),
  experimental: zod.z.object({
    // TODO: This has been made stable and is now "autoCodeSplitting". Remove in next major version.
    enableCodeSplitting: zod.z.boolean().optional()
  }).optional(),
  plugins: zod.z.array(zod.z.custom()).optional(),
  tmpDir: zod.z.string().optional().default("")
});
function resolveConfigPath({ configDirectory }) {
  return path.resolve(configDirectory, "tsr.config.json");
}
function getConfig(inlineConfig = {}, configDirectory) {
  if (configDirectory === void 0) {
    configDirectory = process.cwd();
  }
  const configFilePathJson = resolveConfigPath({ configDirectory });
  const exists = node_fs.existsSync(configFilePathJson);
  let config2;
  if (exists) {
    config2 = configSchema.parse({
      ...JSON.parse(node_fs.readFileSync(configFilePathJson, "utf-8")),
      ...inlineConfig
    });
  } else {
    config2 = configSchema.parse(inlineConfig);
  }
  if (config2.disableTypes) {
    config2.generatedRouteTree = config2.generatedRouteTree.replace(
      /\.(ts|tsx)$/,
      ".js"
    );
  }
  if (configDirectory) {
    if (path.isAbsolute(configDirectory)) {
      config2.routesDirectory = path.resolve(
        configDirectory,
        config2.routesDirectory
      );
      config2.generatedRouteTree = path.resolve(
        configDirectory,
        config2.generatedRouteTree
      );
    } else {
      config2.routesDirectory = path.resolve(
        process.cwd(),
        configDirectory,
        config2.routesDirectory
      );
      config2.generatedRouteTree = path.resolve(
        process.cwd(),
        configDirectory,
        config2.generatedRouteTree
      );
    }
  }
  const resolveTmpDir = (dir) => {
    if (Array.isArray(dir)) {
      dir = path.join(...dir);
    }
    if (!path.isAbsolute(dir)) {
      dir = path.resolve(process.cwd(), dir);
    }
    return dir;
  };
  if (config2.tmpDir) {
    config2.tmpDir = resolveTmpDir(config2.tmpDir);
  } else if (process.env.TSR_TMP_DIR) {
    config2.tmpDir = resolveTmpDir(process.env.TSR_TMP_DIR);
  } else {
    config2.tmpDir = resolveTmpDir([".tanstack", "tmp"]);
  }
  validateConfig(config2);
  return config2;
}
function validateConfig(config2) {
  var _a;
  if (typeof ((_a = config2.experimental) == null ? void 0 : _a.enableCodeSplitting) !== "undefined") {
    const message = `
------
⚠️ ⚠️ ⚠️
ERROR: The "experimental.enableCodeSplitting" flag has been made stable and is now "autoCodeSplitting". Please update your configuration file to use "autoCodeSplitting" instead of "experimental.enableCodeSplitting".
------
`;
    console.error(message);
    throw new Error(message);
  }
  if (config2.indexToken === config2.routeToken) {
    throw new Error(
      `The "indexToken" and "routeToken" options must be different.`
    );
  }
  if (config2.routeFileIgnorePrefix && config2.routeFileIgnorePrefix.trim() === "_") {
    throw new Error(
      `The "routeFileIgnorePrefix" cannot be an underscore ("_"). This is a reserved character used to denote a pathless route. Please use a different prefix.`
    );
  }
  return config2;
}
exports.baseConfigSchema = baseConfigSchema;
exports.configSchema = configSchema;
exports.getConfig = getConfig;
exports.resolveConfigPath = resolveConfigPath;
//# sourceMappingURL=config.cjs.map
