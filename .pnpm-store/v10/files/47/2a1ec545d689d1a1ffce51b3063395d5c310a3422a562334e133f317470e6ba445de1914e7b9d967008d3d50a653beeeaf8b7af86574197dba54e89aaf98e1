import * as fsp from "node:fs/promises";
import path from "node:path";
import * as prettier from "prettier";
import { rootPathId } from "./filesystem/physical/rootPathId.js";
function multiSortBy(arr, accessors = [(d) => d]) {
  return arr.map((d, i) => [d, i]).sort(([a, ai], [b, bi]) => {
    for (const accessor of accessors) {
      const ao = accessor(a);
      const bo = accessor(b);
      if (typeof ao === "undefined") {
        if (typeof bo === "undefined") {
          continue;
        }
        return 1;
      }
      if (ao === bo) {
        continue;
      }
      return ao > bo ? 1 : -1;
    }
    return ai - bi;
  }).map(([d]) => d);
}
function cleanPath(path2) {
  return path2.replace(/\/{2,}/g, "/");
}
function trimPathLeft(path2) {
  return path2 === "/" ? path2 : path2.replace(/^\/{1,}/, "");
}
function removeLeadingSlash(path2) {
  return path2.replace(/^\//, "");
}
function removeTrailingSlash(s) {
  return s.replace(/\/$/, "");
}
const BRACKET_CONTENT_RE = /\[(.*?)\]/g;
function determineInitialRoutePath(routePath) {
  const DISALLOWED_ESCAPE_CHARS = /* @__PURE__ */ new Set([
    "/",
    "\\",
    "?",
    "#",
    ":",
    "*",
    "<",
    ">",
    "|",
    "!",
    "$",
    "%"
  ]);
  const parts = routePath.split(new RegExp("(?<!\\[)\\.(?!\\])", "g"));
  const escapedParts = parts.map((part) => {
    let match;
    while ((match = BRACKET_CONTENT_RE.exec(part)) !== null) {
      const character = match[1];
      if (character === void 0) continue;
      if (DISALLOWED_ESCAPE_CHARS.has(character)) {
        console.error(
          `Error: Disallowed character "${character}" found in square brackets in route path "${routePath}".
You cannot use any of the following characters in square brackets: ${Array.from(
            DISALLOWED_ESCAPE_CHARS
          ).join(", ")}
Please remove and/or replace them.`
        );
        process.exit(1);
      }
    }
    return part.replace(BRACKET_CONTENT_RE, "$1");
  });
  const final = cleanPath(`/${escapedParts.join("/")}`) || "";
  return final;
}
function replaceBackslash(s) {
  return s.replaceAll(/\\/gi, "/");
}
function routePathToVariable(routePath) {
  var _a;
  const toVariableSafeChar = (char) => {
    if (/[a-zA-Z0-9_]/.test(char)) {
      return char;
    }
    switch (char) {
      case ".":
        return "Dot";
      case "-":
        return "Dash";
      case "@":
        return "At";
      case "(":
        return "";
      // Removed since route groups use parentheses
      case ")":
        return "";
      // Removed since route groups use parentheses
      case " ":
        return "";
      // Remove spaces
      default:
        return `Char${char.charCodeAt(0)}`;
    }
  };
  return ((_a = removeUnderscores(routePath)) == null ? void 0 : _a.replace(/\/\$\//g, "/splat/").replace(/\$$/g, "splat").replace(/\$\{\$\}/g, "splat").replace(/\$/g, "").split(/[/-]/g).map((d, i) => i > 0 ? capitalize(d) : d).join("").split("").map(toVariableSafeChar).join("").replace(/^(\d)/g, "R$1")) ?? "";
}
function removeUnderscores(s) {
  return s == null ? void 0 : s.replaceAll(/(^_|_$)/gi, "").replaceAll(/(\/_|_\/)/gi, "/");
}
function capitalize(s) {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function removeExt(d, keepExtension = false) {
  return keepExtension ? d : d.substring(0, d.lastIndexOf(".")) || d;
}
async function writeIfDifferent(filepath, content, incomingContent, callbacks) {
  var _a, _b;
  if (content !== incomingContent) {
    (_a = callbacks == null ? void 0 : callbacks.beforeWrite) == null ? void 0 : _a.call(callbacks);
    await fsp.writeFile(filepath, incomingContent);
    (_b = callbacks == null ? void 0 : callbacks.afterWrite) == null ? void 0 : _b.call(callbacks);
    return true;
  }
  return false;
}
async function format(source, config) {
  const prettierOptions = {
    semi: config.semicolons,
    singleQuote: config.quoteStyle === "single",
    parser: "typescript"
  };
  return prettier.format(source, prettierOptions);
}
function resetRegex(regex) {
  regex.lastIndex = 0;
  return;
}
async function checkFileExists(file) {
  try {
    await fsp.access(file, fsp.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
const possiblyNestedRouteGroupPatternRegex = /\([^/]+\)\/?/g;
function removeGroups(s) {
  return s.replace(possiblyNestedRouteGroupPatternRegex, "");
}
function removeLayoutSegments(routePath = "/") {
  const segments = routePath.split("/");
  const newSegments = segments.filter((segment) => !segment.startsWith("_"));
  return newSegments.join("/");
}
function determineNodePath(node) {
  var _a;
  return node.path = node.parent ? ((_a = node.routePath) == null ? void 0 : _a.replace(node.parent.routePath ?? "", "")) || "/" : node.routePath;
}
function removeLastSegmentFromPath(routePath = "/") {
  const segments = routePath.split("/");
  segments.pop();
  return segments.join("/");
}
function hasParentRoute(routes, node, routePathToCheck) {
  if (!routePathToCheck || routePathToCheck === "/") {
    return null;
  }
  const sortedNodes = multiSortBy(routes, [
    (d) => d.routePath.length * -1,
    (d) => d.variableName
  ]).filter((d) => d.routePath !== `/${rootPathId}`);
  for (const route of sortedNodes) {
    if (route.routePath === "/") continue;
    if (routePathToCheck.startsWith(`${route.routePath}/`) && route.routePath !== routePathToCheck) {
      return route;
    }
  }
  const segments = routePathToCheck.split("/");
  segments.pop();
  const parentRoutePath = segments.join("/");
  return hasParentRoute(routes, node, parentRoutePath);
}
const getResolvedRouteNodeVariableName = (routeNode, variableNameSuffix) => {
  var _a;
  return ((_a = routeNode.children) == null ? void 0 : _a.length) ? `${routeNode.variableName}${variableNameSuffix}WithChildren` : `${routeNode.variableName}${variableNameSuffix}`;
};
function isRouteNodeValidForAugmentation(routeNode) {
  if (!routeNode || routeNode.isVirtual) {
    return false;
  }
  return true;
}
const inferPath = (routeNode) => {
  var _a;
  return routeNode.cleanedPath === "/" ? routeNode.cleanedPath : ((_a = routeNode.cleanedPath) == null ? void 0 : _a.replace(/\/$/, "")) ?? "";
};
const inferFullPath = (routeNode) => {
  const fullPath = removeGroups(
    removeUnderscores(removeLayoutSegments(routeNode.routePath)) ?? ""
  );
  return routeNode.cleanedPath === "/" ? fullPath : fullPath.replace(/\/$/, "");
};
const createRouteNodesByFullPath = (routeNodes) => {
  return new Map(
    routeNodes.map((routeNode) => [inferFullPath(routeNode), routeNode])
  );
};
const createRouteNodesByTo = (routeNodes) => {
  return new Map(
    dedupeBranchesAndIndexRoutes(routeNodes).map((routeNode) => [
      inferTo(routeNode),
      routeNode
    ])
  );
};
const createRouteNodesById = (routeNodes) => {
  return new Map(
    routeNodes.map((routeNode) => {
      const id = routeNode.routePath ?? "";
      return [id, routeNode];
    })
  );
};
const inferTo = (routeNode) => {
  const fullPath = inferFullPath(routeNode);
  if (fullPath === "/") return fullPath;
  return fullPath.replace(/\/$/, "");
};
const dedupeBranchesAndIndexRoutes = (routes) => {
  return routes.filter((route) => {
    var _a;
    if ((_a = route.children) == null ? void 0 : _a.find((child) => child.cleanedPath === "/")) return false;
    return true;
  });
};
function checkUnique(routes, key) {
  const keys = routes.map((d) => d[key]);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    const duplicateKeys = keys.filter((d, i) => keys.indexOf(d) !== i);
    const conflictingFiles = routes.filter(
      (d) => duplicateKeys.includes(d[key])
    );
    return conflictingFiles;
  }
  return void 0;
}
function checkRouteFullPathUniqueness(_routes, config) {
  const routes = _routes.map((d) => {
    const inferredFullPath = inferFullPath(d);
    return { ...d, inferredFullPath };
  });
  const conflictingFiles = checkUnique(routes, "inferredFullPath");
  if (conflictingFiles !== void 0) {
    const errorMessage = `Conflicting configuration paths were found for the following route${conflictingFiles.length > 1 ? "s" : ""}: ${conflictingFiles.map((p) => `"${p.inferredFullPath}"`).join(", ")}.
Please ensure each Route has a unique full path.
Conflicting files: 
 ${conflictingFiles.map((d) => path.resolve(config.routesDirectory, d.filePath)).join("\n ")}
`;
    throw new Error(errorMessage);
  }
}
function buildRouteTreeConfig(nodes, exportName, disableTypes, depth = 1) {
  const children = nodes.filter((n) => {
    var _a;
    return (_a = n.exports) == null ? void 0 : _a.includes(exportName);
  }).map((node) => {
    var _a, _b;
    if (node._fsRouteType === "__root") {
      return;
    }
    if (node._fsRouteType === "pathless_layout" && !((_a = node.children) == null ? void 0 : _a.length)) {
      return;
    }
    const route = `${node.variableName}`;
    if ((_b = node.children) == null ? void 0 : _b.length) {
      const childConfigs = buildRouteTreeConfig(
        node.children,
        exportName,
        disableTypes,
        depth + 1
      );
      const childrenDeclaration = disableTypes ? "" : `interface ${route}${exportName}Children {
  ${node.children.filter((n) => {
        var _a2;
        return (_a2 = n.exports) == null ? void 0 : _a2.includes(exportName);
      }).map(
        (child) => `${child.variableName}${exportName}: typeof ${getResolvedRouteNodeVariableName(child, exportName)}`
      ).join(",")}
}`;
      const children2 = `const ${route}${exportName}Children${disableTypes ? "" : `: ${route}${exportName}Children`} = {
  ${node.children.filter((n) => {
        var _a2;
        return (_a2 = n.exports) == null ? void 0 : _a2.includes(exportName);
      }).map(
        (child) => `${child.variableName}${exportName}: ${getResolvedRouteNodeVariableName(child, exportName)}`
      ).join(",")}
}`;
      const routeWithChildren = `const ${route}${exportName}WithChildren = ${route}${exportName}._addFileChildren(${route}${exportName}Children)`;
      return [
        childConfigs.join("\n"),
        childrenDeclaration,
        children2,
        routeWithChildren
      ].join("\n\n");
    }
    return void 0;
  });
  return children.filter((x) => x !== void 0);
}
function buildImportString(importDeclaration) {
  const { source, specifiers, importKind } = importDeclaration;
  return specifiers.length ? `import ${importKind === "type" ? "type " : ""}{ ${specifiers.map((s) => s.local ? `${s.imported} as ${s.local}` : s.imported).join(", ")} } from '${source}'` : "";
}
function lowerCaseFirstChar(value) {
  if (!value[0]) {
    return value;
  }
  return value[0].toLowerCase() + value.slice(1);
}
function mergeImportDeclarations(imports) {
  const merged = {};
  for (const imp of imports) {
    const key = `${imp.source}-${imp.importKind}`;
    if (!merged[key]) {
      merged[key] = { ...imp, specifiers: [] };
    }
    for (const specifier of imp.specifiers) {
      if (!merged[key].specifiers.some(
        (existing) => existing.imported === specifier.imported && existing.local === specifier.local
      )) {
        merged[key].specifiers.push(specifier);
      }
    }
  }
  return Object.values(merged);
}
function hasChildWithExport(node, exportName) {
  var _a;
  return ((_a = node.children) == null ? void 0 : _a.some((child) => hasChildWithExport(child))) ?? false;
}
const findParent = (node, exportName) => {
  var _a;
  if (!node) {
    return `root${exportName}Import`;
  }
  if (node.parent) {
    if ((_a = node.parent.exports) == null ? void 0 : _a.includes(exportName)) {
      if (node.isVirtualParentRequired) {
        return `${node.parent.variableName}${exportName}`;
      } else {
        return `${node.parent.variableName}${exportName}`;
      }
    }
  }
  return findParent(node.parent, exportName);
};
function buildFileRoutesByPathInterface(opts) {
  return `declare module '${opts.module}' {
  interface ${opts.interfaceName} {
    ${opts.routeNodes.map((routeNode) => {
    var _a;
    const filePathId = routeNode.routePath;
    let preloaderRoute = "";
    if ((_a = routeNode.exports) == null ? void 0 : _a.includes(opts.exportName)) {
      preloaderRoute = `typeof ${routeNode.variableName}${opts.exportName}Import`;
    } else {
      preloaderRoute = "unknown";
    }
    const parent = findParent(routeNode, opts.exportName);
    return `'${filePathId}': {
          id: '${filePathId}'
          path: '${inferPath(routeNode)}'
          fullPath: '${inferFullPath(routeNode)}'
          preLoaderRoute: ${preloaderRoute}
          parentRoute: typeof ${parent}
        }`;
  }).join("\n")}
  }
}`;
}
export {
  buildFileRoutesByPathInterface,
  buildImportString,
  buildRouteTreeConfig,
  capitalize,
  checkFileExists,
  checkRouteFullPathUniqueness,
  cleanPath,
  createRouteNodesByFullPath,
  createRouteNodesById,
  createRouteNodesByTo,
  dedupeBranchesAndIndexRoutes,
  determineInitialRoutePath,
  determineNodePath,
  findParent,
  format,
  getResolvedRouteNodeVariableName,
  hasChildWithExport,
  hasParentRoute,
  inferFullPath,
  inferPath,
  inferTo,
  isRouteNodeValidForAugmentation,
  lowerCaseFirstChar,
  mergeImportDeclarations,
  multiSortBy,
  removeExt,
  removeGroups,
  removeLastSegmentFromPath,
  removeLayoutSegments,
  removeLeadingSlash,
  removeTrailingSlash,
  removeUnderscores,
  replaceBackslash,
  resetRegex,
  routePathToVariable,
  trimPathLeft,
  writeIfDifferent
};
//# sourceMappingURL=utils.js.map
