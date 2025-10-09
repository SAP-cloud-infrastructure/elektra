import path from "node:path";
import * as fsp from "node:fs/promises";
import { replaceBackslash, routePathToVariable, removeExt, determineInitialRoutePath } from "../../utils.js";
import { getRouteNodes as getRouteNodes$1 } from "../virtual/getRouteNodes.js";
import { loadConfigFile } from "../virtual/loadConfigFile.js";
import { logging } from "../../logger.js";
import { rootPathId } from "./rootPathId.js";
const disallowedRouteGroupConfiguration = /\(([^)]+)\).(ts|js|tsx|jsx)/;
const virtualConfigFileRegExp = /__virtual\.[mc]?[jt]s$/;
function isVirtualConfigFile(fileName) {
  return virtualConfigFileRegExp.test(fileName);
}
async function getRouteNodes(config, root) {
  const { routeFilePrefix, routeFileIgnorePrefix, routeFileIgnorePattern } = config;
  const logger = logging({ disabled: config.disableLogging });
  const routeFileIgnoreRegExp = new RegExp(routeFileIgnorePattern ?? "", "g");
  const routeNodes = [];
  const allPhysicalDirectories = [];
  async function recurse(dir) {
    const fullDir = path.resolve(config.routesDirectory, dir);
    let dirList = await fsp.readdir(fullDir, { withFileTypes: true });
    dirList = dirList.filter((d) => {
      if (d.name.startsWith(".") || routeFileIgnorePrefix && d.name.startsWith(routeFileIgnorePrefix)) {
        return false;
      }
      if (routeFilePrefix) {
        if (routeFileIgnorePattern) {
          return d.name.startsWith(routeFilePrefix) && !d.name.match(routeFileIgnoreRegExp);
        }
        return d.name.startsWith(routeFilePrefix);
      }
      if (routeFileIgnorePattern) {
        return !d.name.match(routeFileIgnoreRegExp);
      }
      return true;
    });
    const virtualConfigFile = dirList.find((dirent) => {
      return dirent.isFile() && isVirtualConfigFile(dirent.name);
    });
    if (virtualConfigFile !== void 0) {
      const virtualRouteConfigExport = await loadConfigFile(
        path.resolve(fullDir, virtualConfigFile.name)
      );
      let virtualRouteSubtreeConfig;
      if (typeof virtualRouteConfigExport.default === "function") {
        virtualRouteSubtreeConfig = await virtualRouteConfigExport.default();
      } else {
        virtualRouteSubtreeConfig = virtualRouteConfigExport.default;
      }
      const dummyRoot = {
        type: "root",
        file: "",
        children: virtualRouteSubtreeConfig
      };
      const { routeNodes: virtualRouteNodes, physicalDirectories } = await getRouteNodes$1(
        {
          ...config,
          routesDirectory: fullDir,
          virtualRouteConfig: dummyRoot
        },
        root
      );
      allPhysicalDirectories.push(...physicalDirectories);
      virtualRouteNodes.forEach((node) => {
        const filePath = replaceBackslash(path.join(dir, node.filePath));
        const routePath = `/${dir}${node.routePath}`;
        node.variableName = routePathToVariable(
          `${dir}/${removeExt(node.filePath)}`
        );
        node.routePath = routePath;
        node.filePath = filePath;
      });
      routeNodes.push(...virtualRouteNodes);
      return;
    }
    await Promise.all(
      dirList.map(async (dirent) => {
        const fullPath = replaceBackslash(path.join(fullDir, dirent.name));
        const relativePath = path.posix.join(dir, dirent.name);
        if (dirent.isDirectory()) {
          await recurse(relativePath);
        } else if (fullPath.match(/\.(tsx|ts|jsx|js)$/)) {
          const filePath = replaceBackslash(path.join(dir, dirent.name));
          const filePathNoExt = removeExt(filePath);
          let routePath = determineInitialRoutePath(filePathNoExt);
          if (routeFilePrefix) {
            routePath = routePath.replaceAll(routeFilePrefix, "");
          }
          if (disallowedRouteGroupConfiguration.test(dirent.name)) {
            const errorMessage = `A route configuration for a route group was found at \`${filePath}\`. This is not supported. Did you mean to use a layout/pathless route instead?`;
            logger.error(`ERROR: ${errorMessage}`);
            throw new Error(errorMessage);
          }
          const meta = getRouteMeta(routePath, config);
          const variableName = meta.variableName;
          let routeType = meta.fsRouteType;
          if (routeType === "lazy") {
            routePath = routePath.replace(/\/lazy$/, "");
          }
          if (isValidPathlessLayoutRoute(routePath, routeType, config)) {
            routeType = "pathless_layout";
          }
          [
            ["component", "component"],
            ["errorComponent", "errorComponent"],
            ["pendingComponent", "pendingComponent"],
            ["loader", "loader"]
          ].forEach(([matcher, type]) => {
            if (routeType === matcher) {
              logger.warn(
                `WARNING: The \`.${type}.tsx\` suffix used for the ${filePath} file is deprecated. Use the new \`.lazy.tsx\` suffix instead.`
              );
            }
          });
          routePath = routePath.replace(
            new RegExp(
              `/(component|errorComponent|pendingComponent|loader|${config.routeToken}|lazy)$`
            ),
            ""
          );
          if (routePath === config.indexToken) {
            routePath = "/";
          }
          routePath = routePath.replace(new RegExp(`/${config.indexToken}$`), "/") || "/";
          routeNodes.push({
            filePath,
            fullPath,
            routePath,
            variableName,
            _fsRouteType: routeType
          });
        }
      })
    );
    return routeNodes;
  }
  await recurse("./");
  const rootRouteNode = routeNodes.find((d) => d.routePath === `/${rootPathId}`);
  if (rootRouteNode) {
    rootRouteNode._fsRouteType = "__root";
    rootRouteNode.variableName = "root";
  }
  return {
    rootRouteNode,
    routeNodes,
    physicalDirectories: allPhysicalDirectories
  };
}
function getRouteMeta(routePath, config) {
  let fsRouteType = "static";
  if (routePath.endsWith(`/${config.routeToken}`)) {
    fsRouteType = "layout";
  } else if (routePath.endsWith("/lazy")) {
    fsRouteType = "lazy";
  } else if (routePath.endsWith("/loader")) {
    fsRouteType = "loader";
  } else if (routePath.endsWith("/component")) {
    fsRouteType = "component";
  } else if (routePath.endsWith("/pendingComponent")) {
    fsRouteType = "pendingComponent";
  } else if (routePath.endsWith("/errorComponent")) {
    fsRouteType = "errorComponent";
  }
  const variableName = routePathToVariable(routePath);
  return { fsRouteType, variableName };
}
function isValidPathlessLayoutRoute(normalizedRoutePath, routeType, config) {
  if (routeType === "lazy") {
    return false;
  }
  const segments = normalizedRoutePath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return false;
  }
  const lastRouteSegment = segments[segments.length - 1];
  const secondToLastRouteSegment = segments[segments.length - 2];
  if (lastRouteSegment === rootPathId) {
    return false;
  }
  if (lastRouteSegment === config.routeToken && typeof secondToLastRouteSegment === "string") {
    return secondToLastRouteSegment.startsWith("_");
  }
  return lastRouteSegment !== config.indexToken && lastRouteSegment !== config.routeToken && lastRouteSegment.startsWith("_");
}
export {
  getRouteMeta,
  getRouteNodes,
  isVirtualConfigFile
};
//# sourceMappingURL=getRouteNodes.js.map
