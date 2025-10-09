import path from "node:path";
import * as fsp from "node:fs/promises";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";
import { deepEqual, rootRouteId } from "@tanstack/router-core";
import { logging } from "./logger.js";
import { getRouteNodes as getRouteNodes$1, isVirtualConfigFile } from "./filesystem/physical/getRouteNodes.js";
import { getRouteNodes } from "./filesystem/virtual/getRouteNodes.js";
import { rootPathId } from "./filesystem/physical/rootPathId.js";
import { multiSortBy, format, mergeImportDeclarations, buildImportString, replaceBackslash, removeExt, checkFileExists, resetRegex, hasParentRoute, determineNodePath, trimPathLeft, removeGroups, removeUnderscores, removeLayoutSegments, removeLastSegmentFromPath, routePathToVariable, buildRouteTreeConfig, findParent, createRouteNodesByFullPath, createRouteNodesByTo, createRouteNodesById, getResolvedRouteNodeVariableName, buildFileRoutesByPathInterface, lowerCaseFirstChar, isRouteNodeValidForAugmentation } from "./utils.js";
import { getTargetTemplate, fillTemplate } from "./template.js";
import { transform } from "./transform/transform.js";
import { defaultGeneratorPlugin } from "./plugin/default-generator-plugin.js";
const DefaultFileSystem = {
  stat: async (filePath) => {
    const res = await fsp.stat(filePath, { bigint: true });
    return {
      mtimeMs: res.mtimeMs,
      mode: Number(res.mode),
      uid: Number(res.uid),
      gid: Number(res.gid)
    };
  },
  rename: (oldPath, newPath) => fsp.rename(oldPath, newPath),
  writeFile: (filePath, content) => fsp.writeFile(filePath, content),
  readFile: async (filePath) => {
    try {
      const fileHandle = await fsp.open(filePath, "r");
      const stat = await fileHandle.stat({ bigint: true });
      const fileContent = (await fileHandle.readFile()).toString();
      await fileHandle.close();
      return { stat, fileContent };
    } catch (e) {
      if ("code" in e) {
        if (e.code === "ENOENT") {
          return "file-not-existing";
        }
      }
      throw e;
    }
  },
  chmod: (filePath, mode) => fsp.chmod(filePath, mode),
  chown: (filePath, uid, gid) => fsp.chown(filePath, uid, gid)
};
function rerun(opts) {
  const { event, ...rest } = opts;
  return { rerun: true, event: event ?? { type: "rerun" }, ...rest };
}
function isRerun(result) {
  return typeof result === "object" && result !== null && "rerun" in result && result.rerun === true;
}
class Generator {
  constructor(opts) {
    this.routeNodeCache = /* @__PURE__ */ new Map();
    this.routeNodeShadowCache = /* @__PURE__ */ new Map();
    this.fileEventQueue = [];
    this.plugins = [defaultGeneratorPlugin()];
    this.pluginsWithTransform = [];
    this.transformPlugins = [];
    this.routeGroupPatternRegex = /\(.+\)/g;
    this.physicalDirectories = [];
    this.config = opts.config;
    this.logger = logging({ disabled: this.config.disableLogging });
    this.root = opts.root;
    this.fs = opts.fs || DefaultFileSystem;
    this.generatedRouteTreePath = path.resolve(this.config.generatedRouteTree);
    this.targetTemplate = getTargetTemplate(this.config);
    this.routesDirectoryPath = this.getRoutesDirectoryPath();
    this.plugins.push(...opts.config.plugins || []);
    this.plugins.forEach((plugin) => {
      if ("transformPlugin" in plugin) {
        if (this.pluginsWithTransform.find((p) => p.name === plugin.name)) {
          throw new Error(
            `Plugin with name "${plugin.name}" is already registered for export ${plugin.transformPlugin.exportName}!`
          );
        }
        this.pluginsWithTransform.push(plugin);
        this.transformPlugins.push(plugin.transformPlugin);
      }
    });
  }
  getRoutesDirectoryPath() {
    return path.isAbsolute(this.config.routesDirectory) ? this.config.routesDirectory : path.resolve(this.root, this.config.routesDirectory);
  }
  getRoutesByFileMap() {
    return new Map(
      [...this.routeNodeCache.entries()].map(([filePath, cacheEntry]) => [
        filePath,
        { routePath: cacheEntry.routeId }
      ])
    );
  }
  async run(event) {
    if (event && event.type !== "rerun" && !this.isFileRelevantForRouteTreeGeneration(event.path)) {
      return;
    }
    this.fileEventQueue.push(event ?? { type: "rerun" });
    if (this.runPromise) {
      return this.runPromise;
    }
    this.runPromise = (async () => {
      do {
        const tempQueue = this.fileEventQueue;
        this.fileEventQueue = [];
        const remainingEvents = (await Promise.all(
          tempQueue.map(async (e) => {
            if (e.type === "update") {
              let cacheEntry;
              if (e.path === this.generatedRouteTreePath) {
                cacheEntry = this.routeTreeFileCache;
              } else {
                cacheEntry = this.routeNodeCache.get(e.path);
              }
              const change = await this.didFileChangeComparedToCache(
                { path: e.path },
                cacheEntry
              );
              if (change.result === false) {
                return null;
              }
            }
            return e;
          })
        )).filter((e) => e !== null);
        if (remainingEvents.length === 0) {
          break;
        }
        try {
          const start = performance.now();
          await this.generatorInternal();
          const end = performance.now();
          this.logger.info(
            `Generated route tree in ${Math.round(end - start)}ms`
          );
        } catch (err) {
          const errArray = !Array.isArray(err) ? [err] : err;
          const recoverableErrors = errArray.filter((e) => isRerun(e));
          if (recoverableErrors.length === errArray.length) {
            this.fileEventQueue.push(...recoverableErrors.map((e) => e.event));
            recoverableErrors.forEach((e) => {
              if (e.msg) {
                this.logger.info(e.msg);
              }
            });
          } else {
            const unrecoverableErrors = errArray.filter((e) => !isRerun(e));
            this.runPromise = void 0;
            throw new Error(
              unrecoverableErrors.map((e) => e.message).join()
            );
          }
        }
      } while (this.fileEventQueue.length);
      this.runPromise = void 0;
    })();
    return this.runPromise;
  }
  async generatorInternal() {
    let writeRouteTreeFile = false;
    let getRouteNodesResult;
    if (this.config.virtualRouteConfig) {
      getRouteNodesResult = await getRouteNodes(this.config, this.root);
    } else {
      getRouteNodesResult = await getRouteNodes$1(this.config, this.root);
    }
    const {
      rootRouteNode,
      routeNodes: beforeRouteNodes,
      physicalDirectories
    } = getRouteNodesResult;
    if (rootRouteNode === void 0) {
      let errorMessage = `rootRouteNode must not be undefined. Make sure you've added your root route into the route-tree.`;
      if (!this.config.virtualRouteConfig) {
        errorMessage += `
Make sure that you add a "${rootPathId}.${this.config.disableTypes ? "js" : "tsx"}" file to your routes directory.
Add the file in: "${this.config.routesDirectory}/${rootPathId}.${this.config.disableTypes ? "js" : "tsx"}"`;
      }
      throw new Error(errorMessage);
    }
    this.physicalDirectories = physicalDirectories;
    writeRouteTreeFile = await this.handleRootNode(rootRouteNode);
    const preRouteNodes = multiSortBy(beforeRouteNodes, [
      (d) => d.routePath === "/" ? -1 : 1,
      (d) => {
        var _a;
        return (_a = d.routePath) == null ? void 0 : _a.split("/").length;
      },
      (d) => d.filePath.match(new RegExp(`[./]${this.config.indexToken}[.]`)) ? 1 : -1,
      (d) => d.filePath.match(
        /[./](component|errorComponent|pendingComponent|loader|lazy)[.]/
      ) ? 1 : -1,
      (d) => d.filePath.match(new RegExp(`[./]${this.config.routeToken}[.]`)) ? -1 : 1,
      (d) => {
        var _a;
        return ((_a = d.routePath) == null ? void 0 : _a.endsWith("/")) ? -1 : 1;
      },
      (d) => d.routePath
    ]).filter((d) => ![`/${rootPathId}`].includes(d.routePath || ""));
    const routeFileAllResult = await Promise.allSettled(
      preRouteNodes.filter((n) => !n.isVirtualParentRoute && !n.isVirtual).map((n) => this.processRouteNodeFile(n))
    );
    const rejections = routeFileAllResult.filter(
      (result) => result.status === "rejected"
    );
    if (rejections.length > 0) {
      throw rejections.map((e) => e.reason);
    }
    const routeFileResult = routeFileAllResult.flatMap((result) => {
      if (result.status === "fulfilled" && result.value !== null) {
        return result.value;
      }
      return [];
    });
    routeFileResult.forEach((result) => {
      var _a;
      if (!((_a = result.node.exports) == null ? void 0 : _a.length)) {
        this.logger.warn(
          `Route file "${result.cacheEntry.fileContent}" does not export any route piece. This is likely a mistake.`
        );
      }
    });
    if (routeFileResult.find((r) => r.shouldWriteTree)) {
      writeRouteTreeFile = true;
    }
    if (!this.routeTreeFileCache) {
      const routeTreeFile = await this.fs.readFile(this.generatedRouteTreePath);
      if (routeTreeFile !== "file-not-existing") {
        this.routeTreeFileCache = {
          fileContent: routeTreeFile.fileContent,
          mtimeMs: routeTreeFile.stat.mtimeMs
        };
      }
      writeRouteTreeFile = true;
    } else {
      const routeTreeFileChange = await this.didFileChangeComparedToCache(
        { path: this.generatedRouteTreePath },
        this.routeTreeFileCache
      );
      if (routeTreeFileChange.result !== false) {
        writeRouteTreeFile = "force";
        if (routeTreeFileChange.result === true) {
          const routeTreeFile = await this.fs.readFile(
            this.generatedRouteTreePath
          );
          if (routeTreeFile !== "file-not-existing") {
            this.routeTreeFileCache = {
              fileContent: routeTreeFile.fileContent,
              mtimeMs: routeTreeFile.stat.mtimeMs
            };
          }
        }
      }
    }
    if (!writeRouteTreeFile) {
      for (const fullPath of this.routeNodeCache.keys()) {
        if (!this.routeNodeShadowCache.has(fullPath)) {
          writeRouteTreeFile = true;
          break;
        }
      }
    }
    if (!writeRouteTreeFile) {
      this.swapCaches();
      return;
    }
    let routeTreeContent = this.buildRouteTreeFileContent(
      rootRouteNode,
      preRouteNodes,
      routeFileResult
    );
    routeTreeContent = this.config.enableRouteTreeFormatting ? await format(routeTreeContent, this.config) : routeTreeContent;
    let newMtimeMs;
    if (this.routeTreeFileCache) {
      if (writeRouteTreeFile !== "force" && this.routeTreeFileCache.fileContent === routeTreeContent) ;
      else {
        const newRouteTreeFileStat = await this.safeFileWrite({
          filePath: this.generatedRouteTreePath,
          newContent: routeTreeContent,
          strategy: {
            type: "mtime",
            expectedMtimeMs: this.routeTreeFileCache.mtimeMs
          }
        });
        newMtimeMs = newRouteTreeFileStat.mtimeMs;
      }
    } else {
      const newRouteTreeFileStat = await this.safeFileWrite({
        filePath: this.generatedRouteTreePath,
        newContent: routeTreeContent,
        strategy: {
          type: "new-file"
        }
      });
      newMtimeMs = newRouteTreeFileStat.mtimeMs;
    }
    if (newMtimeMs !== void 0) {
      this.routeTreeFileCache = {
        fileContent: routeTreeContent,
        mtimeMs: newMtimeMs
      };
    }
    this.swapCaches();
  }
  swapCaches() {
    this.routeNodeCache = this.routeNodeShadowCache;
    this.routeNodeShadowCache = /* @__PURE__ */ new Map();
  }
  buildRouteTreeFileContent(rootRouteNode, preRouteNodes, routeFileResult) {
    const getImportForRouteNode = (node, exportName) => {
      var _a;
      if ((_a = node.exports) == null ? void 0 : _a.includes(exportName)) {
        return {
          source: `./${this.getImportPath(node)}`,
          specifiers: [
            {
              imported: exportName,
              local: `${node.variableName}${exportName}Import`
            }
          ]
        };
      }
      return void 0;
    };
    const buildRouteTreeForExport = (plugin) => {
      var _a, _b, _c;
      const exportName = plugin.transformPlugin.exportName;
      const acc = {
        routeTree: [],
        routeNodes: [],
        routePiecesByPath: {}
      };
      for (const node of preRouteNodes) {
        if ((_a = node.exports) == null ? void 0 : _a.includes(plugin.transformPlugin.exportName)) {
          this.handleNode(node, acc);
        }
      }
      const sortedRouteNodes = multiSortBy(acc.routeNodes, [
        (d) => {
          var _a2;
          return ((_a2 = d.routePath) == null ? void 0 : _a2.includes(`/${rootPathId}`)) ? -1 : 1;
        },
        (d) => {
          var _a2;
          return (_a2 = d.routePath) == null ? void 0 : _a2.split("/").length;
        },
        (d) => {
          var _a2;
          return ((_a2 = d.routePath) == null ? void 0 : _a2.endsWith(this.config.indexToken)) ? -1 : 1;
        },
        (d) => d
      ]);
      const pluginConfig = plugin.config({
        generator: this,
        rootRouteNode,
        sortedRouteNodes
      });
      const routeImports2 = sortedRouteNodes.filter((d) => !d.isVirtual).flatMap((node) => getImportForRouteNode(node, exportName) ?? []);
      const hasMatchingRouteFiles = acc.routeNodes.length > 0 || ((_b = rootRouteNode.exports) == null ? void 0 : _b.includes(exportName));
      const virtualRouteNodes = sortedRouteNodes.filter((d) => d.isVirtual).map((node) => {
        return `const ${node.variableName}${exportName}Import = ${plugin.createVirtualRouteCode({ node })}`;
      });
      if (!((_c = rootRouteNode.exports) == null ? void 0 : _c.includes(exportName)) && pluginConfig.virtualRootRoute) {
        virtualRouteNodes.unshift(
          `const ${rootRouteNode.variableName}${exportName}Import = ${plugin.createRootRouteCode()}`
        );
      }
      const imports = plugin.imports({
        sortedRouteNodes,
        acc,
        generator: this,
        rootRouteNode
      });
      const routeTreeConfig = buildRouteTreeConfig(
        acc.routeTree,
        exportName,
        this.config.disableTypes
      );
      const createUpdateRoutes = sortedRouteNodes.map((node) => {
        var _a2, _b2, _c2, _d, _e;
        const loaderNode = (_a2 = acc.routePiecesByPath[node.routePath]) == null ? void 0 : _a2.loader;
        const componentNode = (_b2 = acc.routePiecesByPath[node.routePath]) == null ? void 0 : _b2.component;
        const errorComponentNode = (_c2 = acc.routePiecesByPath[node.routePath]) == null ? void 0 : _c2.errorComponent;
        const pendingComponentNode = (_d = acc.routePiecesByPath[node.routePath]) == null ? void 0 : _d.pendingComponent;
        const lazyComponentNode = (_e = acc.routePiecesByPath[node.routePath]) == null ? void 0 : _e.lazy;
        return [
          [
            `const ${node.variableName}${exportName} = ${node.variableName}${exportName}Import.update({
            ${[
              `id: '${node.path}'`,
              !node.isNonPath ? `path: '${node.cleanedPath}'` : void 0,
              `getParentRoute: () => ${findParent(node, exportName)}`
            ].filter(Boolean).join(",")}
          }${this.config.disableTypes ? "" : "as any"})`,
            loaderNode ? `.updateLoader({ loader: lazyFn(() => import('./${replaceBackslash(
              removeExt(
                path.relative(
                  path.dirname(this.config.generatedRouteTree),
                  path.resolve(
                    this.config.routesDirectory,
                    loaderNode.filePath
                  )
                ),
                this.config.addExtensions
              )
            )}'), 'loader') })` : "",
            componentNode || errorComponentNode || pendingComponentNode ? `.update({
                ${[
              ["component", componentNode],
              ["errorComponent", errorComponentNode],
              ["pendingComponent", pendingComponentNode]
            ].filter((d) => d[1]).map((d) => {
              return `${d[0]}: lazyRouteComponent(() => import('./${replaceBackslash(
                removeExt(
                  path.relative(
                    path.dirname(this.config.generatedRouteTree),
                    path.resolve(
                      this.config.routesDirectory,
                      d[1].filePath
                    )
                  ),
                  this.config.addExtensions
                )
              )}'), '${d[0]}')`;
            }).join("\n,")}
              })` : "",
            lazyComponentNode ? `.lazy(() => import('./${replaceBackslash(
              removeExt(
                path.relative(
                  path.dirname(this.config.generatedRouteTree),
                  path.resolve(
                    this.config.routesDirectory,
                    lazyComponentNode.filePath
                  )
                ),
                this.config.addExtensions
              )
            )}').then((d) => d.${exportName}))` : ""
          ].join("")
        ].join("\n\n");
      });
      let fileRoutesByPathInterfacePerPlugin = "";
      let fileRoutesByFullPathPerPlugin = "";
      if (!this.config.disableTypes && hasMatchingRouteFiles) {
        fileRoutesByFullPathPerPlugin = [
          `export interface File${exportName}sByFullPath {
${[...createRouteNodesByFullPath(acc.routeNodes).entries()].filter(([fullPath]) => fullPath).map(([fullPath, routeNode]) => {
            return `'${fullPath}': typeof ${getResolvedRouteNodeVariableName(routeNode, exportName)}`;
          })}
}`,
          `export interface File${exportName}sByTo {
${[...createRouteNodesByTo(acc.routeNodes).entries()].filter(([to]) => to).map(([to, routeNode]) => {
            return `'${to}': typeof ${getResolvedRouteNodeVariableName(routeNode, exportName)}`;
          })}
}`,
          `export interface File${exportName}sById {
'${rootRouteId}': typeof root${exportName}Import,
${[...createRouteNodesById(acc.routeNodes).entries()].map(([id, routeNode]) => {
            return `'${id}': typeof ${getResolvedRouteNodeVariableName(routeNode, exportName)}`;
          })}
}`,
          `export interface File${exportName}Types {
file${exportName}sByFullPath: File${exportName}sByFullPath
fullPaths: ${acc.routeNodes.length > 0 ? [...createRouteNodesByFullPath(acc.routeNodes).keys()].filter((fullPath) => fullPath).map((fullPath) => `'${fullPath}'`).join("|") : "never"}
file${exportName}sByTo: File${exportName}sByTo
to: ${acc.routeNodes.length > 0 ? [...createRouteNodesByTo(acc.routeNodes).keys()].filter((to) => to).map((to) => `'${to}'`).join("|") : "never"}
id: ${[`'${rootRouteId}'`, ...[...createRouteNodesById(acc.routeNodes).keys()].map((id) => `'${id}'`)].join("|")}
file${exportName}sById: File${exportName}sById
}`,
          `export interface Root${exportName}Children {
${acc.routeTree.map((child) => `${child.variableName}${exportName}: typeof ${getResolvedRouteNodeVariableName(child, exportName)}`).join(",")}
}`
        ].join("\n");
        fileRoutesByPathInterfacePerPlugin = buildFileRoutesByPathInterface({
          ...plugin.moduleAugmentation({ generator: this }),
          routeNodes: this.config.verboseFileRoutes !== false ? sortedRouteNodes : [
            ...routeFileResult.map(({ node }) => node),
            ...sortedRouteNodes.filter((d) => d.isVirtual)
          ],
          exportName
        });
      }
      let routeTree = "";
      if (hasMatchingRouteFiles) {
        routeTree = [
          `const root${exportName}Children${this.config.disableTypes ? "" : `: Root${exportName}Children`} = {
  ${acc.routeTree.map(
            (child) => `${child.variableName}${exportName}: ${getResolvedRouteNodeVariableName(child, exportName)}`
          ).join(",")}
}`,
          `export const ${lowerCaseFirstChar(exportName)}Tree = root${exportName}Import._addFileChildren(root${exportName}Children)${this.config.disableTypes ? "" : `._addFileTypes<File${exportName}Types>()`}`
        ].join("\n");
      }
      return {
        routeImports: routeImports2,
        sortedRouteNodes,
        acc,
        virtualRouteNodes,
        routeTreeConfig,
        routeTree,
        imports,
        createUpdateRoutes,
        fileRoutesByFullPathPerPlugin,
        fileRoutesByPathInterfacePerPlugin
      };
    };
    const routeTrees = this.pluginsWithTransform.map((plugin) => ({
      exportName: plugin.transformPlugin.exportName,
      ...buildRouteTreeForExport(plugin)
    }));
    this.plugins.map((plugin) => {
      var _a;
      return (_a = plugin.onRouteTreesChanged) == null ? void 0 : _a.call(plugin, {
        routeTrees,
        rootRouteNode,
        generator: this
      });
    });
    let mergedImports = mergeImportDeclarations(
      routeTrees.flatMap((d) => d.imports)
    );
    if (this.config.disableTypes) {
      mergedImports = mergedImports.filter((d) => d.importKind !== "type");
    }
    const importStatements = mergedImports.map(buildImportString);
    let moduleAugmentation = "";
    if (this.config.verboseFileRoutes === false && !this.config.disableTypes) {
      moduleAugmentation = routeFileResult.map(({ node }) => {
        const getModuleDeclaration = (routeNode) => {
          if (!isRouteNodeValidForAugmentation(routeNode)) {
            return "";
          }
          const moduleAugmentation2 = this.pluginsWithTransform.map((plugin) => {
            return plugin.routeModuleAugmentation({
              routeNode
            });
          }).filter(Boolean).join("\n");
          return `declare module './${this.getImportPath(routeNode)}' {
                      ${moduleAugmentation2}
                    }`;
        };
        return getModuleDeclaration(node);
      }).join("\n");
    }
    const routeImports = routeTrees.flatMap((t) => t.routeImports);
    const rootRouteImports = this.pluginsWithTransform.flatMap(
      (p) => getImportForRouteNode(rootRouteNode, p.transformPlugin.exportName) ?? []
    );
    if (rootRouteImports.length > 0) {
      routeImports.unshift(...rootRouteImports);
    }
    const routeTreeContent = [
      ...this.config.routeTreeFileHeader,
      `// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.`,
      [...importStatements].join("\n"),
      mergeImportDeclarations(routeImports).map(buildImportString).join("\n"),
      routeTrees.flatMap((t) => t.virtualRouteNodes).join("\n"),
      routeTrees.flatMap((t) => t.createUpdateRoutes).join("\n"),
      routeTrees.map((t) => t.fileRoutesByFullPathPerPlugin).join("\n"),
      routeTrees.map((t) => t.fileRoutesByPathInterfacePerPlugin).join("\n"),
      moduleAugmentation,
      routeTrees.flatMap((t) => t.routeTreeConfig).join("\n"),
      routeTrees.map((t) => t.routeTree).join("\n"),
      ...this.config.routeTreeFileFooter
    ].filter(Boolean).join("\n\n");
    return routeTreeContent;
  }
  getImportPath(node) {
    return replaceBackslash(
      removeExt(
        path.relative(
          path.dirname(this.config.generatedRouteTree),
          path.resolve(this.config.routesDirectory, node.filePath)
        ),
        this.config.addExtensions
      )
    );
  }
  async processRouteNodeFile(node) {
    var _a, _b, _c, _d, _e;
    const result = await this.isRouteFileCacheFresh(node);
    if (result.status === "fresh") {
      node.exports = result.cacheEntry.exports;
      return {
        node,
        shouldWriteTree: result.exportsChanged,
        cacheEntry: result.cacheEntry
      };
    }
    const existingRouteFile = await this.fs.readFile(node.fullPath);
    if (existingRouteFile === "file-not-existing") {
      throw new Error(`⚠️ File ${node.fullPath} does not exist`);
    }
    const updatedCacheEntry = {
      fileContent: existingRouteFile.fileContent,
      mtimeMs: existingRouteFile.stat.mtimeMs,
      exports: [],
      routeId: node.routePath ?? "$$TSR_NO_ROUTE_PATH_ASSIGNED$$"
    };
    const escapedRoutePath = ((_a = node.routePath) == null ? void 0 : _a.replaceAll("$", "$$")) ?? "";
    let shouldWriteRouteFile = false;
    if (!existingRouteFile.fileContent) {
      shouldWriteRouteFile = true;
      if (node._fsRouteType === "lazy") {
        const tLazyRouteTemplate = this.targetTemplate.lazyRoute;
        updatedCacheEntry.fileContent = await fillTemplate(
          this.config,
          (((_b = this.config.customScaffolding) == null ? void 0 : _b.lazyRouteTemplate) || ((_c = this.config.customScaffolding) == null ? void 0 : _c.routeTemplate)) ?? tLazyRouteTemplate.template(),
          {
            tsrImports: tLazyRouteTemplate.imports.tsrImports(),
            tsrPath: escapedRoutePath.replaceAll(/\{(.+?)\}/gm, "$1"),
            tsrExportStart: tLazyRouteTemplate.imports.tsrExportStart(escapedRoutePath),
            tsrExportEnd: tLazyRouteTemplate.imports.tsrExportEnd()
          }
        );
        updatedCacheEntry.exports = ["Route"];
      } else if (
        // Creating a new normal route file
        ["layout", "static"].some(
          (d) => d === node._fsRouteType
        ) || [
          "component",
          "pendingComponent",
          "errorComponent",
          "loader"
        ].every((d) => d !== node._fsRouteType)
      ) {
        const tRouteTemplate = this.targetTemplate.route;
        updatedCacheEntry.fileContent = await fillTemplate(
          this.config,
          ((_d = this.config.customScaffolding) == null ? void 0 : _d.routeTemplate) ?? tRouteTemplate.template(),
          {
            tsrImports: tRouteTemplate.imports.tsrImports(),
            tsrPath: escapedRoutePath.replaceAll(/\{(.+?)\}/gm, "$1"),
            tsrExportStart: tRouteTemplate.imports.tsrExportStart(escapedRoutePath),
            tsrExportEnd: tRouteTemplate.imports.tsrExportEnd()
          }
        );
        updatedCacheEntry.exports = ["Route"];
      } else {
        return null;
      }
    } else {
      const transformResult = await transform({
        source: updatedCacheEntry.fileContent,
        ctx: {
          target: this.config.target,
          routeId: escapedRoutePath,
          lazy: node._fsRouteType === "lazy",
          verboseFileRoutes: !(this.config.verboseFileRoutes === false)
        },
        plugins: this.transformPlugins
      });
      if (transformResult.result === "error") {
        throw new Error(
          `Error transforming route file ${node.fullPath}: ${transformResult.error}`
        );
      }
      updatedCacheEntry.exports = transformResult.exports;
      if (transformResult.result === "modified") {
        updatedCacheEntry.fileContent = transformResult.output;
        shouldWriteRouteFile = true;
      }
    }
    if (shouldWriteRouteFile) {
      const stats = await this.safeFileWrite({
        filePath: node.fullPath,
        newContent: updatedCacheEntry.fileContent,
        strategy: {
          type: "mtime",
          expectedMtimeMs: updatedCacheEntry.mtimeMs
        }
      });
      updatedCacheEntry.mtimeMs = stats.mtimeMs;
    }
    this.routeNodeShadowCache.set(node.fullPath, updatedCacheEntry);
    node.exports = updatedCacheEntry.exports;
    const shouldWriteTree = !deepEqual(
      (_e = result.cacheEntry) == null ? void 0 : _e.exports,
      updatedCacheEntry.exports
    );
    return {
      node,
      shouldWriteTree,
      cacheEntry: updatedCacheEntry
    };
  }
  async didRouteFileChangeComparedToCache(file, cache) {
    const cacheEntry = this[cache].get(file.path);
    return this.didFileChangeComparedToCache(file, cacheEntry);
  }
  async didFileChangeComparedToCache(file, cacheEntry) {
    if (!cacheEntry) {
      return { result: "file-not-in-cache" };
    }
    let mtimeMs = file.mtimeMs;
    if (mtimeMs === void 0) {
      try {
        const currentStat = await this.fs.stat(file.path);
        mtimeMs = currentStat.mtimeMs;
      } catch {
        return { result: "cannot-stat-file" };
      }
    }
    return { result: mtimeMs !== cacheEntry.mtimeMs, mtimeMs, cacheEntry };
  }
  async safeFileWrite(opts) {
    const tmpPath = this.getTempFileName(opts.filePath);
    await this.fs.writeFile(tmpPath, opts.newContent);
    if (opts.strategy.type === "mtime") {
      const beforeStat = await this.fs.stat(opts.filePath);
      if (beforeStat.mtimeMs !== opts.strategy.expectedMtimeMs) {
        throw rerun({
          msg: `File ${opts.filePath} was modified by another process during processing.`,
          event: { type: "update", path: opts.filePath }
        });
      }
      const newFileState = await this.fs.stat(tmpPath);
      if (newFileState.mode !== beforeStat.mode) {
        await this.fs.chmod(tmpPath, beforeStat.mode);
      }
      if (newFileState.uid !== beforeStat.uid || newFileState.gid !== beforeStat.gid) {
        try {
          await this.fs.chown(tmpPath, beforeStat.uid, beforeStat.gid);
        } catch (err) {
          if (typeof err === "object" && err !== null && "code" in err && err.code === "EPERM") {
            console.warn(
              `[safeFileWrite] chown failed: ${err.message}`
            );
          } else {
            throw err;
          }
        }
      }
    } else {
      if (await checkFileExists(opts.filePath)) {
        throw rerun({
          msg: `File ${opts.filePath} already exists. Cannot overwrite.`,
          event: { type: "update", path: opts.filePath }
        });
      }
    }
    const stat = await this.fs.stat(tmpPath);
    await this.fs.rename(tmpPath, opts.filePath);
    return stat;
  }
  getTempFileName(filePath) {
    const absPath = path.resolve(filePath);
    const hash = crypto.createHash("md5").update(absPath).digest("hex");
    if (!this.sessionId) {
      mkdirSync(this.config.tmpDir, { recursive: true });
      this.sessionId = crypto.randomBytes(4).toString("hex");
    }
    return path.join(this.config.tmpDir, `${this.sessionId}-${hash}`);
  }
  async isRouteFileCacheFresh(node) {
    const fileChangedCache = await this.didRouteFileChangeComparedToCache(
      { path: node.fullPath },
      "routeNodeCache"
    );
    if (fileChangedCache.result === false) {
      this.routeNodeShadowCache.set(node.fullPath, fileChangedCache.cacheEntry);
      return {
        status: "fresh",
        exportsChanged: false,
        cacheEntry: fileChangedCache.cacheEntry
      };
    }
    if (fileChangedCache.result === "cannot-stat-file") {
      throw new Error(`⚠️ expected route file to exist at ${node.fullPath}`);
    }
    const mtimeMs = fileChangedCache.result === true ? fileChangedCache.mtimeMs : void 0;
    const shadowCacheFileChange = await this.didRouteFileChangeComparedToCache(
      { path: node.fullPath, mtimeMs },
      "routeNodeShadowCache"
    );
    if (shadowCacheFileChange.result === "cannot-stat-file") {
      throw new Error(`⚠️ expected route file to exist at ${node.fullPath}`);
    }
    if (shadowCacheFileChange.result === false) {
      if (fileChangedCache.result === true) {
        if (deepEqual(
          fileChangedCache.cacheEntry.exports,
          shadowCacheFileChange.cacheEntry.exports
        )) {
          return {
            status: "fresh",
            exportsChanged: false,
            cacheEntry: shadowCacheFileChange.cacheEntry
          };
        }
        return {
          status: "fresh",
          exportsChanged: true,
          cacheEntry: shadowCacheFileChange.cacheEntry
        };
      }
    }
    if (fileChangedCache.result === "file-not-in-cache") {
      return {
        status: "stale"
      };
    }
    return { status: "stale", cacheEntry: fileChangedCache.cacheEntry };
  }
  async handleRootNode(node) {
    var _a;
    const result = await this.isRouteFileCacheFresh(node);
    if (result.status === "fresh") {
      node.exports = result.cacheEntry.exports;
      this.routeNodeShadowCache.set(node.fullPath, result.cacheEntry);
      return result.exportsChanged;
    }
    const rootNodeFile = await this.fs.readFile(node.fullPath);
    if (rootNodeFile === "file-not-existing") {
      throw new Error(`⚠️ expected root route to exist at ${node.fullPath}`);
    }
    const updatedCacheEntry = {
      fileContent: rootNodeFile.fileContent,
      mtimeMs: rootNodeFile.stat.mtimeMs,
      exports: [],
      routeId: node.routePath ?? "$$TSR_NO_ROOT_ROUTE_PATH_ASSIGNED$$"
    };
    if (!rootNodeFile.fileContent) {
      const rootTemplate = this.targetTemplate.rootRoute;
      const rootRouteContent = await fillTemplate(
        this.config,
        rootTemplate.template(),
        {
          tsrImports: rootTemplate.imports.tsrImports(),
          tsrPath: rootPathId,
          tsrExportStart: rootTemplate.imports.tsrExportStart(),
          tsrExportEnd: rootTemplate.imports.tsrExportEnd()
        }
      );
      this.logger.log(`🟡 Creating ${node.fullPath}`);
      const stats = await this.safeFileWrite({
        filePath: node.fullPath,
        newContent: rootRouteContent,
        strategy: {
          type: "mtime",
          expectedMtimeMs: rootNodeFile.stat.mtimeMs
        }
      });
      updatedCacheEntry.fileContent = rootRouteContent;
      updatedCacheEntry.mtimeMs = stats.mtimeMs;
    }
    const rootRouteExports = [];
    for (const plugin of this.pluginsWithTransform) {
      const exportName = plugin.transformPlugin.exportName;
      if (rootNodeFile.fileContent.includes(`export const ${exportName}`)) {
        rootRouteExports.push(exportName);
      }
    }
    updatedCacheEntry.exports = rootRouteExports;
    node.exports = rootRouteExports;
    this.routeNodeShadowCache.set(node.fullPath, updatedCacheEntry);
    const shouldWriteTree = !deepEqual(
      (_a = result.cacheEntry) == null ? void 0 : _a.exports,
      rootRouteExports
    );
    return shouldWriteTree;
  }
  handleNode(node, acc) {
    var _a;
    resetRegex(this.routeGroupPatternRegex);
    let parentRoute = hasParentRoute(acc.routeNodes, node, node.routePath);
    if ((parentRoute == null ? void 0 : parentRoute.isVirtualParentRoute) && ((_a = parentRoute.children) == null ? void 0 : _a.length)) {
      const possibleParentRoute = hasParentRoute(
        parentRoute.children,
        node,
        node.routePath
      );
      if (possibleParentRoute) {
        parentRoute = possibleParentRoute;
      }
    }
    if (parentRoute) node.parent = parentRoute;
    node.path = determineNodePath(node);
    const trimmedPath = trimPathLeft(node.path ?? "");
    const split = trimmedPath.split("/");
    const lastRouteSegment = split[split.length - 1] ?? trimmedPath;
    node.isNonPath = lastRouteSegment.startsWith("_") || split.every((part) => this.routeGroupPatternRegex.test(part));
    node.cleanedPath = removeGroups(
      removeUnderscores(removeLayoutSegments(node.path)) ?? ""
    );
    if (!node.isVirtual && [
      "lazy",
      "loader",
      "component",
      "pendingComponent",
      "errorComponent"
    ].some((d) => d === node._fsRouteType)) {
      acc.routePiecesByPath[node.routePath] = acc.routePiecesByPath[node.routePath] || {};
      acc.routePiecesByPath[node.routePath][node._fsRouteType === "lazy" ? "lazy" : node._fsRouteType === "loader" ? "loader" : node._fsRouteType === "errorComponent" ? "errorComponent" : node._fsRouteType === "pendingComponent" ? "pendingComponent" : "component"] = node;
      const anchorRoute = acc.routeNodes.find(
        (d) => d.routePath === node.routePath
      );
      if (!anchorRoute) {
        this.handleNode(
          {
            ...node,
            isVirtual: true,
            _fsRouteType: "static"
          },
          acc
        );
      }
      return;
    }
    const cleanedPathIsEmpty = (node.cleanedPath || "").length === 0;
    const nonPathRoute = node._fsRouteType === "pathless_layout" && node.isNonPath;
    node.isVirtualParentRequired = node._fsRouteType === "pathless_layout" || nonPathRoute ? !cleanedPathIsEmpty : false;
    if (!node.isVirtual && node.isVirtualParentRequired) {
      const parentRoutePath = removeLastSegmentFromPath(node.routePath) || "/";
      const parentVariableName = routePathToVariable(parentRoutePath);
      const anchorRoute = acc.routeNodes.find(
        (d) => d.routePath === parentRoutePath
      );
      if (!anchorRoute) {
        const parentNode = {
          ...node,
          path: removeLastSegmentFromPath(node.path) || "/",
          filePath: removeLastSegmentFromPath(node.filePath) || "/",
          fullPath: removeLastSegmentFromPath(node.fullPath) || "/",
          routePath: parentRoutePath,
          variableName: parentVariableName,
          isVirtual: true,
          _fsRouteType: "layout",
          // layout since this route will wrap other routes
          isVirtualParentRoute: true,
          isVirtualParentRequired: false
        };
        parentNode.children = parentNode.children ?? [];
        parentNode.children.push(node);
        node.parent = parentNode;
        if (node._fsRouteType === "pathless_layout") {
          node.path = determineNodePath(node);
        }
        this.handleNode(parentNode, acc);
      } else {
        anchorRoute.children = anchorRoute.children ?? [];
        anchorRoute.children.push(node);
        node.parent = anchorRoute;
      }
    }
    if (node.parent) {
      if (!node.isVirtualParentRequired) {
        node.parent.children = node.parent.children ?? [];
        node.parent.children.push(node);
      }
    } else {
      acc.routeTree.push(node);
    }
    acc.routeNodes.push(node);
  }
  // only process files that are relevant for the route tree generation
  isFileRelevantForRouteTreeGeneration(filePath) {
    if (filePath === this.generatedRouteTreePath) {
      return true;
    }
    if (filePath.startsWith(this.routesDirectoryPath)) {
      return true;
    }
    if (typeof this.config.virtualRouteConfig === "string" && filePath === this.config.virtualRouteConfig) {
      return true;
    }
    if (this.routeNodeCache.has(filePath)) {
      return true;
    }
    if (isVirtualConfigFile(path.basename(filePath))) {
      return true;
    }
    if (this.physicalDirectories.some((dir) => filePath.startsWith(dir))) {
      return true;
    }
    return false;
  }
}
export {
  Generator
};
//# sourceMappingURL=generator.js.map
