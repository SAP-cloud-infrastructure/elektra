"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const defaultTransformPlugin = require("../transform/default-transform-plugin.cjs");
const utils = require("../utils.cjs");
const EXPORT_NAME = "Route";
function defaultGeneratorPlugin() {
  return {
    name: "default",
    transformPlugin: defaultTransformPlugin.defaultTransformPlugin,
    imports: (opts) => {
      var _a;
      const imports = [];
      if (opts.acc.routeNodes.some((n) => n.isVirtual)) {
        imports.push({
          specifiers: [{ imported: "createFileRoute" }],
          source: opts.generator.targetTemplate.fullPkg
        });
      }
      if (opts.generator.config.verboseFileRoutes === false) {
        const typeImport = {
          specifiers: [],
          source: opts.generator.targetTemplate.fullPkg,
          importKind: "type"
        };
        if (opts.sortedRouteNodes.some(
          (d) => utils.isRouteNodeValidForAugmentation(d) && d._fsRouteType !== "lazy"
        )) {
          typeImport.specifiers.push({ imported: "CreateFileRoute" });
        }
        if (opts.sortedRouteNodes.some(
          (node) => {
            var _a2;
            return ((_a2 = opts.acc.routePiecesByPath[node.routePath]) == null ? void 0 : _a2.lazy) && utils.isRouteNodeValidForAugmentation(node);
          }
        )) {
          typeImport.specifiers.push({ imported: "CreateLazyFileRoute" });
        }
        if (typeImport.specifiers.length > 0) {
          typeImport.specifiers.push({ imported: "FileRoutesByPath" });
          imports.push(typeImport);
        }
      }
      const hasMatchingRouteFiles = opts.acc.routeNodes.length > 0;
      if (hasMatchingRouteFiles) {
        if (!((_a = opts.rootRouteNode.exports) == null ? void 0 : _a.includes(EXPORT_NAME))) {
          imports.push({
            specifiers: [{ imported: "createRootRoute" }],
            source: opts.generator.targetTemplate.fullPkg
          });
        }
      }
      return imports;
    },
    moduleAugmentation: ({ generator }) => ({
      module: generator.targetTemplate.fullPkg,
      interfaceName: "FileRoutesByPath"
    }),
    onRouteTreesChanged: ({ routeTrees, generator }) => {
      const routeTree = routeTrees.find(
        (tree) => tree.exportName === EXPORT_NAME
      );
      if (!routeTree) {
        throw new Error(
          'No route tree found with export name "Route". Please ensure your routes are correctly defined.'
        );
      }
      utils.checkRouteFullPathUniqueness(
        routeTree.sortedRouteNodes.filter(
          (d) => {
            var _a;
            return d.children === void 0 && "lazy" !== d._fsRouteType && ((_a = d.exports) == null ? void 0 : _a.includes(EXPORT_NAME));
          }
        ),
        generator.config
      );
    },
    routeModuleAugmentation: ({ routeNode }) => {
      if (routeNode._fsRouteType === "lazy") {
        return `const createLazyFileRoute: CreateLazyFileRoute<FileRoutesByPath['${routeNode.routePath}']['preLoaderRoute']>`;
      } else {
        return `const createFileRoute: CreateFileRoute<'${routeNode.routePath}',
            FileRoutesByPath['${routeNode.routePath}']['parentRoute'],
            FileRoutesByPath['${routeNode.routePath}']['id'],
            FileRoutesByPath['${routeNode.routePath}']['path'],
            FileRoutesByPath['${routeNode.routePath}']['fullPath']
          >
        `;
      }
    },
    createRootRouteCode: () => `createRootRoute()`,
    createVirtualRouteCode: ({ node }) => `createFileRoute('${node.routePath}')()`,
    config: ({ sortedRouteNodes }) => {
      const hasMatchingRouteFiles = sortedRouteNodes.length > 0;
      return {
        virtualRootRoute: hasMatchingRouteFiles
      };
    }
  };
}
exports.defaultGeneratorPlugin = defaultGeneratorPlugin;
//# sourceMappingURL=default-generator-plugin.cjs.map
