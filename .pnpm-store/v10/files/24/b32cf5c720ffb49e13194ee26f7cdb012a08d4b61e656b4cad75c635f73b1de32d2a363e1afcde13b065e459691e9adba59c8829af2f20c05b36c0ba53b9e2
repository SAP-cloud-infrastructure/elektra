import path, { resolve, join } from "node:path";
import { replaceBackslash, routePathToVariable, removeExt, removeTrailingSlash, removeLeadingSlash } from "../../utils.js";
import { getRouteNodes as getRouteNodes$1 } from "../physical/getRouteNodes.js";
import { rootPathId } from "../physical/rootPathId.js";
import { virtualRootRouteSchema } from "./config.js";
import { loadConfigFile } from "./loadConfigFile.js";
function ensureLeadingUnderScore(id) {
  if (id.startsWith("_")) {
    return id;
  }
  return `_${id}`;
}
function flattenTree(node) {
  const result = [node];
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child));
    }
  }
  delete node.children;
  return result;
}
async function getRouteNodes(tsrConfig, root) {
  const fullDir = resolve(tsrConfig.routesDirectory);
  if (tsrConfig.virtualRouteConfig === void 0) {
    throw new Error(`virtualRouteConfig is undefined`);
  }
  let virtualRouteConfig;
  if (typeof tsrConfig.virtualRouteConfig === "string") {
    virtualRouteConfig = await getVirtualRouteConfigFromFileExport(
      tsrConfig,
      root
    );
  } else {
    virtualRouteConfig = tsrConfig.virtualRouteConfig;
  }
  const { children, physicalDirectories } = await getRouteNodesRecursive(
    tsrConfig,
    root,
    fullDir,
    virtualRouteConfig.children
  );
  const allNodes = flattenTree({
    children,
    filePath: virtualRouteConfig.file,
    fullPath: replaceBackslash(join(fullDir, virtualRouteConfig.file)),
    variableName: "root",
    routePath: `/${rootPathId}`,
    _fsRouteType: "__root"
  });
  const rootRouteNode = allNodes[0];
  const routeNodes = allNodes.slice(1);
  return { rootRouteNode, routeNodes, physicalDirectories };
}
async function getVirtualRouteConfigFromFileExport(tsrConfig, root) {
  if (tsrConfig.virtualRouteConfig === void 0 || typeof tsrConfig.virtualRouteConfig !== "string" || tsrConfig.virtualRouteConfig === "") {
    throw new Error(`virtualRouteConfig is undefined or empty`);
  }
  const exports = await loadConfigFile(join(root, tsrConfig.virtualRouteConfig));
  if (!("routes" in exports) && !("default" in exports)) {
    throw new Error(
      `routes not found in ${tsrConfig.virtualRouteConfig}. The routes export must be named like 'export const routes = ...' or done using 'export default ...'`
    );
  }
  const virtualRouteConfig = "routes" in exports ? exports.routes : exports.default;
  return virtualRootRouteSchema.parse(virtualRouteConfig);
}
async function getRouteNodesRecursive(tsrConfig, root, fullDir, nodes, parent) {
  if (nodes === void 0) {
    return { children: [], physicalDirectories: [] };
  }
  const allPhysicalDirectories = [];
  const children = await Promise.all(
    nodes.map(async (node) => {
      if (node.type === "physical") {
        const { routeNodes, physicalDirectories } = await getRouteNodes$1(
          {
            ...tsrConfig,
            routesDirectory: resolve(fullDir, node.directory)
          },
          root
        );
        allPhysicalDirectories.push(node.directory);
        routeNodes.forEach((subtreeNode) => {
          subtreeNode.variableName = routePathToVariable(
            `${node.pathPrefix}/${removeExt(subtreeNode.filePath)}`
          );
          subtreeNode.routePath = `${(parent == null ? void 0 : parent.routePath) ?? ""}${node.pathPrefix}${subtreeNode.routePath}`;
          subtreeNode.filePath = `${node.directory}/${subtreeNode.filePath}`;
        });
        return routeNodes;
      }
      function getFile(file) {
        const filePath = file;
        const variableName = routePathToVariable(removeExt(filePath));
        const fullPath = replaceBackslash(join(fullDir, filePath));
        return { filePath, variableName, fullPath };
      }
      const parentRoutePath = removeTrailingSlash((parent == null ? void 0 : parent.routePath) ?? "/");
      switch (node.type) {
        case "index": {
          const { filePath, variableName, fullPath } = getFile(node.file);
          const routePath = `${parentRoutePath}/`;
          return {
            filePath,
            fullPath,
            variableName,
            routePath,
            _fsRouteType: "static"
          };
        }
        case "route": {
          const lastSegment = node.path;
          let routeNode;
          const routePath = `${parentRoutePath}/${removeLeadingSlash(lastSegment)}`;
          if (node.file) {
            const { filePath, variableName, fullPath } = getFile(node.file);
            routeNode = {
              filePath,
              fullPath,
              variableName,
              routePath,
              _fsRouteType: "static"
            };
          } else {
            routeNode = {
              filePath: "",
              fullPath: "",
              variableName: routePathToVariable(routePath),
              routePath,
              isVirtual: true,
              _fsRouteType: "static"
            };
          }
          if (node.children !== void 0) {
            const { children: children2, physicalDirectories } = await getRouteNodesRecursive(
              tsrConfig,
              root,
              fullDir,
              node.children,
              routeNode
            );
            routeNode.children = children2;
            allPhysicalDirectories.push(...physicalDirectories);
            routeNode._fsRouteType = "layout";
          }
          return routeNode;
        }
        case "layout": {
          const { filePath, variableName, fullPath } = getFile(node.file);
          if (node.id !== void 0) {
            node.id = ensureLeadingUnderScore(node.id);
          } else {
            const baseName = path.basename(filePath);
            const fileNameWithoutExt = path.parse(baseName).name;
            node.id = ensureLeadingUnderScore(fileNameWithoutExt);
          }
          const lastSegment = node.id;
          const routePath = `${parentRoutePath}/${removeLeadingSlash(lastSegment)}`;
          const routeNode = {
            fullPath,
            filePath,
            variableName,
            routePath,
            _fsRouteType: "pathless_layout"
          };
          if (node.children !== void 0) {
            const { children: children2, physicalDirectories } = await getRouteNodesRecursive(
              tsrConfig,
              root,
              fullDir,
              node.children,
              routeNode
            );
            routeNode.children = children2;
            allPhysicalDirectories.push(...physicalDirectories);
          }
          return routeNode;
        }
      }
    })
  );
  return {
    children: children.flat(),
    physicalDirectories: allPhysicalDirectories
  };
}
export {
  getRouteNodes,
  getRouteNodesRecursive
};
//# sourceMappingURL=getRouteNodes.js.map
