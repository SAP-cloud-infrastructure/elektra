"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const t = require("@babel/types");
const babel = require("@babel/core");
const template = require("@babel/template");
const babelDeadCodeElimination = require("babel-dead-code-elimination");
const routerUtils = require("@tanstack/router-utils");
const constants = require("../constants.cjs");
const routeHmrStatement = require("../route-hmr-statement.cjs");
const pathIds = require("./path-ids.cjs");
const frameworkOptions = require("./framework-options.cjs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const t__namespace = /* @__PURE__ */ _interopNamespaceDefault(t);
const template__namespace = /* @__PURE__ */ _interopNamespaceDefault(template);
const SPLIT_NODES_CONFIG = /* @__PURE__ */ new Map([
  [
    "loader",
    {
      routeIdent: "loader",
      localImporterIdent: "$$splitLoaderImporter",
      // const $$splitLoaderImporter = () => import('...')
      splitStrategy: "lazyFn",
      localExporterIdent: "SplitLoader",
      // const SplitLoader = ...
      exporterIdent: "loader"
      // export { SplitLoader as loader }
    }
  ],
  [
    "component",
    {
      routeIdent: "component",
      localImporterIdent: "$$splitComponentImporter",
      // const $$splitComponentImporter = () => import('...')
      splitStrategy: "lazyRouteComponent",
      localExporterIdent: "SplitComponent",
      // const SplitComponent = ...
      exporterIdent: "component"
      // export { SplitComponent as component }
    }
  ],
  [
    "pendingComponent",
    {
      routeIdent: "pendingComponent",
      localImporterIdent: "$$splitPendingComponentImporter",
      // const $$splitPendingComponentImporter = () => import('...')
      splitStrategy: "lazyRouteComponent",
      localExporterIdent: "SplitPendingComponent",
      // const SplitPendingComponent = ...
      exporterIdent: "pendingComponent"
      // export { SplitPendingComponent as pendingComponent }
    }
  ],
  [
    "errorComponent",
    {
      routeIdent: "errorComponent",
      localImporterIdent: "$$splitErrorComponentImporter",
      // const $$splitErrorComponentImporter = () => import('...')
      splitStrategy: "lazyRouteComponent",
      localExporterIdent: "SplitErrorComponent",
      // const SplitErrorComponent = ...
      exporterIdent: "errorComponent"
      // export { SplitErrorComponent as errorComponent }
    }
  ],
  [
    "notFoundComponent",
    {
      routeIdent: "notFoundComponent",
      localImporterIdent: "$$splitNotFoundComponentImporter",
      // const $$splitNotFoundComponentImporter = () => import('...')
      splitStrategy: "lazyRouteComponent",
      localExporterIdent: "SplitNotFoundComponent",
      // const SplitNotFoundComponent = ...
      exporterIdent: "notFoundComponent"
      // export { SplitNotFoundComponent as notFoundComponent }
    }
  ]
]);
const KNOWN_SPLIT_ROUTE_IDENTS = [...SPLIT_NODES_CONFIG.keys()];
function addSplitSearchParamToFilename(filename, grouping) {
  const [bareFilename] = filename.split("?");
  const params = new URLSearchParams();
  params.append(constants.tsrSplit, pathIds.createIdentifier(grouping));
  return `${bareFilename}?${params.toString()}`;
}
function removeSplitSearchParamFromFilename(filename) {
  const [bareFilename] = filename.split("?");
  return bareFilename;
}
const splittableCreateRouteFns = ["createFileRoute"];
const unsplittableCreateRouteFns = [
  "createRootRoute",
  "createRootRouteWithContext"
];
const allCreateRouteFns = [
  ...splittableCreateRouteFns,
  ...unsplittableCreateRouteFns
];
function compileCodeSplitReferenceRoute(opts) {
  const ast = routerUtils.parseAst(opts);
  const refIdents = babelDeadCodeElimination.findReferencedIdentifiers(ast);
  function findIndexForSplitNode(str) {
    return opts.codeSplitGroupings.findIndex(
      (group) => group.includes(str)
    );
  }
  const frameworkOptions$1 = frameworkOptions.getFrameworkOptions(opts.targetFramework);
  const PACKAGE = frameworkOptions$1.package;
  const LAZY_ROUTE_COMPONENT_IDENT = frameworkOptions$1.idents.lazyRouteComponent;
  const LAZY_FN_IDENT = frameworkOptions$1.idents.lazyFn;
  let createRouteFn;
  babel.traverse(ast, {
    Program: {
      enter(programPath) {
        const removableImportPaths = /* @__PURE__ */ new Set([]);
        programPath.traverse({
          CallExpression: (path) => {
            if (!t__namespace.isIdentifier(path.node.callee)) {
              return;
            }
            if (!allCreateRouteFns.includes(path.node.callee.name)) {
              return;
            }
            createRouteFn = path.node.callee.name;
            function babelHandleReference(routeOptions) {
              const hasImportedOrDefinedIdentifier = (name) => {
                return programPath.scope.hasBinding(name);
              };
              if (t__namespace.isObjectExpression(routeOptions)) {
                if (opts.deleteNodes && opts.deleteNodes.size > 0) {
                  routeOptions.properties = routeOptions.properties.filter(
                    (prop) => {
                      var _a;
                      if (t__namespace.isObjectProperty(prop)) {
                        if (t__namespace.isIdentifier(prop.key)) {
                          if ((_a = opts.deleteNodes) == null ? void 0 : _a.has(prop.key.name)) {
                            return false;
                          }
                        }
                      }
                      return true;
                    }
                  );
                }
                if (!splittableCreateRouteFns.includes(createRouteFn)) {
                  if (opts.addHmr) {
                    programPath.pushContainer("body", routeHmrStatement.routeHmrStatement);
                  }
                  return programPath.stop();
                }
                routeOptions.properties.forEach((prop) => {
                  if (t__namespace.isObjectProperty(prop)) {
                    if (t__namespace.isIdentifier(prop.key)) {
                      const key = prop.key.name;
                      const codeSplitGroupingByKey = findIndexForSplitNode(key);
                      if (codeSplitGroupingByKey === -1) {
                        return;
                      }
                      const codeSplitGroup = [
                        ...new Set(
                          opts.codeSplitGroupings[codeSplitGroupingByKey]
                        )
                      ];
                      const isNodeConfigAvailable = SPLIT_NODES_CONFIG.has(
                        key
                      );
                      if (!isNodeConfigAvailable) {
                        return;
                      }
                      if (t__namespace.isBooleanLiteral(prop.value) || t__namespace.isNullLiteral(prop.value) || t__namespace.isIdentifier(prop.value) && prop.value.name === "undefined") {
                        return;
                      }
                      const splitNodeMeta = SPLIT_NODES_CONFIG.get(key);
                      const splitUrl = addSplitSearchParamToFilename(
                        opts.filename,
                        codeSplitGroup
                      );
                      if (splitNodeMeta.splitStrategy === "lazyRouteComponent") {
                        const value = prop.value;
                        let shouldSplit = true;
                        if (t__namespace.isIdentifier(value)) {
                          const existingImportPath = getImportSpecifierAndPathFromLocalName(
                            programPath,
                            value.name
                          ).path;
                          if (existingImportPath) {
                            removableImportPaths.add(existingImportPath);
                          }
                          const isExported = hasExport(ast, value);
                          shouldSplit = !isExported;
                          if (shouldSplit) {
                            removeIdentifierLiteral(path, value);
                          }
                        }
                        if (!shouldSplit) {
                          return;
                        }
                        if (!hasImportedOrDefinedIdentifier(
                          LAZY_ROUTE_COMPONENT_IDENT
                        )) {
                          programPath.unshiftContainer("body", [
                            template__namespace.statement(
                              `import { ${LAZY_ROUTE_COMPONENT_IDENT} } from '${PACKAGE}'`
                            )()
                          ]);
                        }
                        if (!hasImportedOrDefinedIdentifier(
                          splitNodeMeta.localImporterIdent
                        )) {
                          programPath.unshiftContainer("body", [
                            template__namespace.statement(
                              `const ${splitNodeMeta.localImporterIdent} = () => import('${splitUrl}')`
                            )()
                          ]);
                        }
                        prop.value = template__namespace.expression(
                          `${LAZY_ROUTE_COMPONENT_IDENT}(${splitNodeMeta.localImporterIdent}, '${splitNodeMeta.exporterIdent}')`
                        )();
                        if (opts.addHmr) {
                          programPath.pushContainer("body", routeHmrStatement.routeHmrStatement);
                        }
                      }
                      if (splitNodeMeta.splitStrategy === "lazyFn") {
                        const value = prop.value;
                        let shouldSplit = true;
                        if (t__namespace.isIdentifier(value)) {
                          const existingImportPath = getImportSpecifierAndPathFromLocalName(
                            programPath,
                            value.name
                          ).path;
                          if (existingImportPath) {
                            removableImportPaths.add(existingImportPath);
                          }
                          const isExported = hasExport(ast, value);
                          shouldSplit = !isExported;
                          if (shouldSplit) {
                            removeIdentifierLiteral(path, value);
                          }
                        }
                        if (!shouldSplit) {
                          return;
                        }
                        if (!hasImportedOrDefinedIdentifier(LAZY_FN_IDENT)) {
                          programPath.unshiftContainer(
                            "body",
                            template__namespace.smart(
                              `import { ${LAZY_FN_IDENT} } from '${PACKAGE}'`
                            )()
                          );
                        }
                        if (!hasImportedOrDefinedIdentifier(
                          splitNodeMeta.localImporterIdent
                        )) {
                          programPath.unshiftContainer("body", [
                            template__namespace.statement(
                              `const ${splitNodeMeta.localImporterIdent} = () => import('${splitUrl}')`
                            )()
                          ]);
                        }
                        prop.value = template__namespace.expression(
                          `${LAZY_FN_IDENT}(${splitNodeMeta.localImporterIdent}, '${splitNodeMeta.exporterIdent}')`
                        )();
                      }
                    }
                  }
                  programPath.scope.crawl();
                });
              }
            }
            if (t__namespace.isCallExpression(path.parentPath.node)) {
              const options = resolveIdentifier(
                path,
                path.parentPath.node.arguments[0]
              );
              babelHandleReference(options);
            } else if (t__namespace.isVariableDeclarator(path.parentPath.node)) {
              const caller = resolveIdentifier(path, path.parentPath.node.init);
              if (t__namespace.isCallExpression(caller)) {
                const options = resolveIdentifier(path, caller.arguments[0]);
                babelHandleReference(options);
              }
            }
          }
        });
        if (removableImportPaths.size > 0) {
          programPath.traverse({
            ImportDeclaration(path) {
              if (path.node.specifiers.length > 0) return;
              if (removableImportPaths.has(path.node.source.value)) {
                path.remove();
              }
            }
          });
        }
      }
    }
  });
  babelDeadCodeElimination.deadCodeElimination(ast, refIdents);
  return routerUtils.generateFromAst(ast, {
    sourceMaps: true,
    sourceFileName: opts.filename,
    filename: opts.filename
  });
}
function compileCodeSplitVirtualRoute(opts) {
  const ast = routerUtils.parseAst(opts);
  const refIdents = babelDeadCodeElimination.findReferencedIdentifiers(ast);
  const intendedSplitNodes = new Set(opts.splitTargets);
  const knownExportedIdents = /* @__PURE__ */ new Set();
  babel.traverse(ast, {
    Program: {
      enter(programPath) {
        const trackedNodesToSplitByType = {
          component: void 0,
          loader: void 0,
          pendingComponent: void 0,
          errorComponent: void 0,
          notFoundComponent: void 0
        };
        programPath.traverse({
          CallExpression: (path) => {
            if (!t__namespace.isIdentifier(path.node.callee)) {
              return;
            }
            if (!splittableCreateRouteFns.includes(path.node.callee.name)) {
              return;
            }
            function babelHandleVirtual(options) {
              if (t__namespace.isObjectExpression(options)) {
                options.properties.forEach((prop) => {
                  if (t__namespace.isObjectProperty(prop)) {
                    KNOWN_SPLIT_ROUTE_IDENTS.forEach((splitType) => {
                      if (!t__namespace.isIdentifier(prop.key) || prop.key.name !== splitType) {
                        return;
                      }
                      const value = prop.value;
                      if (t__namespace.isIdentifier(value) && value.name === "undefined") {
                        return;
                      }
                      let isExported = false;
                      if (t__namespace.isIdentifier(value)) {
                        isExported = hasExport(ast, value);
                        if (isExported) {
                          knownExportedIdents.add(value.name);
                        }
                      }
                      if (isExported && t__namespace.isIdentifier(value)) {
                        removeExports(ast, value);
                      } else {
                        const meta = SPLIT_NODES_CONFIG.get(splitType);
                        trackedNodesToSplitByType[splitType] = {
                          node: prop.value,
                          meta
                        };
                      }
                    });
                  }
                });
                options.properties = [];
              }
            }
            if (t__namespace.isCallExpression(path.parentPath.node)) {
              const options = resolveIdentifier(
                path,
                path.parentPath.node.arguments[0]
              );
              babelHandleVirtual(options);
            } else if (t__namespace.isVariableDeclarator(path.parentPath.node)) {
              const caller = resolveIdentifier(path, path.parentPath.node.init);
              if (t__namespace.isCallExpression(caller)) {
                const options = resolveIdentifier(path, caller.arguments[0]);
                babelHandleVirtual(options);
              }
            }
          }
        });
        intendedSplitNodes.forEach((SPLIT_TYPE) => {
          const splitKey = trackedNodesToSplitByType[SPLIT_TYPE];
          if (!splitKey) {
            return;
          }
          let splitNode = splitKey.node;
          const splitMeta = { ...splitKey.meta, shouldRemoveNode: true };
          while (t__namespace.isIdentifier(splitNode)) {
            const binding = programPath.scope.getBinding(splitNode.name);
            splitNode = binding == null ? void 0 : binding.path.node;
          }
          if (splitNode) {
            if (t__namespace.isFunctionDeclaration(splitNode)) {
              if (!splitNode.id) {
                throw new Error(
                  `Function declaration for "${SPLIT_TYPE}" must have an identifier.`
                );
              }
              splitMeta.shouldRemoveNode = false;
              splitMeta.localExporterIdent = splitNode.id.name;
            } else if (t__namespace.isFunctionExpression(splitNode) || t__namespace.isArrowFunctionExpression(splitNode)) {
              programPath.pushContainer(
                "body",
                t__namespace.variableDeclaration("const", [
                  t__namespace.variableDeclarator(
                    t__namespace.identifier(splitMeta.localExporterIdent),
                    splitNode
                  )
                ])
              );
            } else if (t__namespace.isImportSpecifier(splitNode) || t__namespace.isImportDefaultSpecifier(splitNode)) {
              programPath.pushContainer(
                "body",
                t__namespace.variableDeclaration("const", [
                  t__namespace.variableDeclarator(
                    t__namespace.identifier(splitMeta.localExporterIdent),
                    splitNode.local
                  )
                ])
              );
            } else if (t__namespace.isVariableDeclarator(splitNode)) {
              if (t__namespace.isIdentifier(splitNode.id)) {
                splitMeta.localExporterIdent = splitNode.id.name;
                splitMeta.shouldRemoveNode = false;
              } else {
                throw new Error(
                  `Unexpected splitNode type ☝️: ${splitNode.type}`
                );
              }
            } else if (t__namespace.isCallExpression(splitNode)) {
              const outputSplitNodeCode = routerUtils.generateFromAst(splitNode).code;
              const splitNodeAst = babel.parse(outputSplitNodeCode);
              if (!splitNodeAst) {
                throw new Error(
                  `Failed to parse the generated code for "${SPLIT_TYPE}" in the node type "${splitNode.type}"`
                );
              }
              const statement = splitNodeAst.program.body[0];
              if (!statement) {
                throw new Error(
                  `Failed to parse the generated code for "${SPLIT_TYPE}" in the node type "${splitNode.type}" as no statement was found in the program body`
                );
              }
              if (t__namespace.isExpressionStatement(statement)) {
                const expression = statement.expression;
                programPath.pushContainer(
                  "body",
                  t__namespace.variableDeclaration("const", [
                    t__namespace.variableDeclarator(
                      t__namespace.identifier(splitMeta.localExporterIdent),
                      expression
                    )
                  ])
                );
              } else {
                throw new Error(
                  `Unexpected expression type encounter for "${SPLIT_TYPE}" in the node type "${splitNode.type}"`
                );
              }
            } else if (t__namespace.isConditionalExpression(splitNode)) {
              programPath.pushContainer(
                "body",
                t__namespace.variableDeclaration("const", [
                  t__namespace.variableDeclarator(
                    t__namespace.identifier(splitMeta.localExporterIdent),
                    splitNode
                  )
                ])
              );
            } else if (t__namespace.isTSAsExpression(splitNode)) {
              splitNode = splitNode.expression;
              programPath.pushContainer(
                "body",
                t__namespace.variableDeclaration("const", [
                  t__namespace.variableDeclarator(
                    t__namespace.identifier(splitMeta.localExporterIdent),
                    splitNode
                  )
                ])
              );
            } else if (t__namespace.isBooleanLiteral(splitNode)) {
              return;
            } else if (t__namespace.isNullLiteral(splitNode)) {
              return;
            } else {
              console.info("Unexpected splitNode type:", splitNode);
              throw new Error(`Unexpected splitNode type ☝️: ${splitNode.type}`);
            }
          }
          if (splitMeta.shouldRemoveNode) {
            programPath.node.body = programPath.node.body.filter((node) => {
              return node !== splitNode;
            });
          }
          programPath.pushContainer("body", [
            t__namespace.exportNamedDeclaration(null, [
              t__namespace.exportSpecifier(
                t__namespace.identifier(splitMeta.localExporterIdent),
                // local variable name
                t__namespace.identifier(splitMeta.exporterIdent)
                // as what name it should be exported as
              )
            ])
          ]);
        });
        programPath.traverse({
          ExportNamedDeclaration(path) {
            if (path.node.declaration) {
              if (t__namespace.isVariableDeclaration(path.node.declaration)) {
                path.replaceWith(
                  t__namespace.importDeclaration(
                    path.node.declaration.declarations.map(
                      (decl) => t__namespace.importSpecifier(
                        t__namespace.identifier(decl.id.name),
                        t__namespace.identifier(decl.id.name)
                      )
                    ),
                    t__namespace.stringLiteral(
                      removeSplitSearchParamFromFilename(opts.filename)
                    )
                  )
                );
              }
            }
          }
        });
      }
    }
  });
  babelDeadCodeElimination.deadCodeElimination(ast, refIdents);
  if (knownExportedIdents.size > 0) {
    const list = Array.from(knownExportedIdents).reduce((str, ident) => {
      str += `
- ${ident}`;
      return str;
    }, "");
    const warningMessage = `These exports from "${opts.filename}" are not being code-split and will increase your bundle size: ${list}
These should either have their export statements removed or be imported from another file that is not a route.`;
    console.warn(warningMessage);
    if (process.env.NODE_ENV !== "production") {
      const warningTemplate = template__namespace.statement(
        `console.warn(${JSON.stringify(warningMessage)})`
      )();
      ast.program.body.unshift(warningTemplate);
    }
  }
  return routerUtils.generateFromAst(ast, {
    sourceMaps: true,
    sourceFileName: opts.filename,
    filename: opts.filename
  });
}
function detectCodeSplitGroupingsFromRoute(opts) {
  const ast = routerUtils.parseAst(opts);
  let codeSplitGroupings = void 0;
  babel.traverse(ast, {
    Program: {
      enter(programPath) {
        programPath.traverse({
          CallExpression(path) {
            if (!t__namespace.isIdentifier(path.node.callee)) {
              return;
            }
            if (!(path.node.callee.name === "createRoute" || path.node.callee.name === "createFileRoute")) {
              return;
            }
            function babelHandleSplittingGroups(routeOptions) {
              if (t__namespace.isObjectExpression(routeOptions)) {
                routeOptions.properties.forEach((prop) => {
                  if (t__namespace.isObjectProperty(prop)) {
                    if (t__namespace.isIdentifier(prop.key)) {
                      if (prop.key.name === "codeSplitGroupings") {
                        const value = prop.value;
                        if (t__namespace.isArrayExpression(value)) {
                          codeSplitGroupings = value.elements.map((group) => {
                            if (t__namespace.isArrayExpression(group)) {
                              return group.elements.map((node) => {
                                if (!t__namespace.isStringLiteral(node)) {
                                  throw new Error(
                                    "You must provide a string literal for the codeSplitGroupings"
                                  );
                                }
                                return node.value;
                              });
                            }
                            throw new Error(
                              "You must provide arrays with codeSplitGroupings options."
                            );
                          });
                        } else {
                          throw new Error(
                            "You must provide an array of arrays for the codeSplitGroupings."
                          );
                        }
                      }
                    }
                  }
                });
              }
            }
            if (t__namespace.isCallExpression(path.parentPath.node)) {
              const options = resolveIdentifier(
                path,
                path.parentPath.node.arguments[0]
              );
              babelHandleSplittingGroups(options);
            } else if (t__namespace.isVariableDeclarator(path.parentPath.node)) {
              const caller = resolveIdentifier(path, path.parentPath.node.init);
              if (t__namespace.isCallExpression(caller)) {
                const options = resolveIdentifier(path, caller.arguments[0]);
                babelHandleSplittingGroups(options);
              }
            }
          }
        });
      }
    }
  });
  return { groupings: codeSplitGroupings };
}
function getImportSpecifierAndPathFromLocalName(programPath, name) {
  let specifier = null;
  let path = null;
  programPath.traverse({
    ImportDeclaration(importPath) {
      const found = importPath.node.specifiers.find(
        (targetSpecifier) => targetSpecifier.local.name === name
      );
      if (found) {
        specifier = found;
        path = importPath.node.source.value;
      }
    }
  });
  return { specifier, path };
}
function resolveIdentifier(path, node) {
  if (t__namespace.isIdentifier(node)) {
    const binding = path.scope.getBinding(node.name);
    if (binding) {
      const declarator = binding.path.node;
      if (t__namespace.isObjectExpression(declarator.init)) {
        return declarator.init;
      } else if (t__namespace.isFunctionDeclaration(declarator.init)) {
        return declarator.init;
      }
    }
    return void 0;
  }
  return node;
}
function removeIdentifierLiteral(path, node) {
  const binding = path.scope.getBinding(node.name);
  if (binding) {
    binding.path.remove();
  }
}
function hasExport(ast, node) {
  let found = false;
  babel.traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        if (t__namespace.isVariableDeclaration(path.node.declaration)) {
          path.node.declaration.declarations.forEach((decl) => {
            if (t__namespace.isVariableDeclarator(decl)) {
              if (t__namespace.isIdentifier(decl.id)) {
                if (decl.id.name === node.name) {
                  found = true;
                }
              }
            }
          });
        }
        if (t__namespace.isFunctionDeclaration(path.node.declaration)) {
          if (t__namespace.isIdentifier(path.node.declaration.id)) {
            if (path.node.declaration.id.name === node.name) {
              found = true;
            }
          }
        }
      }
    },
    ExportDefaultDeclaration(path) {
      if (t__namespace.isIdentifier(path.node.declaration)) {
        if (path.node.declaration.name === node.name) {
          found = true;
        }
      }
      if (t__namespace.isFunctionDeclaration(path.node.declaration)) {
        if (t__namespace.isIdentifier(path.node.declaration.id)) {
          if (path.node.declaration.id.name === node.name) {
            found = true;
          }
        }
      }
    }
  });
  return found;
}
function removeExports(ast, node) {
  let removed = false;
  babel.traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        if (t__namespace.isVariableDeclaration(path.node.declaration)) {
          path.node.declaration.declarations.forEach((decl) => {
            if (t__namespace.isVariableDeclarator(decl)) {
              if (t__namespace.isIdentifier(decl.id)) {
                if (decl.id.name === node.name) {
                  path.remove();
                  removed = true;
                }
              }
            }
          });
        } else if (t__namespace.isFunctionDeclaration(path.node.declaration)) {
          if (t__namespace.isIdentifier(path.node.declaration.id)) {
            if (path.node.declaration.id.name === node.name) {
              path.remove();
              removed = true;
            }
          }
        }
      }
    },
    ExportDefaultDeclaration(path) {
      if (t__namespace.isIdentifier(path.node.declaration)) {
        if (path.node.declaration.name === node.name) {
          path.remove();
          removed = true;
        }
      } else if (t__namespace.isFunctionDeclaration(path.node.declaration)) {
        if (t__namespace.isIdentifier(path.node.declaration.id)) {
          if (path.node.declaration.id.name === node.name) {
            path.remove();
            removed = true;
          }
        }
      }
    }
  });
  return removed;
}
exports.compileCodeSplitReferenceRoute = compileCodeSplitReferenceRoute;
exports.compileCodeSplitVirtualRoute = compileCodeSplitVirtualRoute;
exports.detectCodeSplitGroupingsFromRoute = detectCodeSplitGroupingsFromRoute;
//# sourceMappingURL=compilers.cjs.map
