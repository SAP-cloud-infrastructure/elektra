"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const recast = require("recast");
const utils = require("./utils.cjs");
const b = recast.types.builders;
const EXPORT_NAME = "Route";
const defaultTransformPlugin = {
  name: "default-transform",
  exportName: EXPORT_NAME,
  imports: (ctx) => {
    const imports = {};
    const targetModule = `@tanstack/${ctx.target}-router`;
    if (ctx.verboseFileRoutes === false) {
      imports.banned = [
        {
          source: targetModule,
          specifiers: [
            { imported: "createLazyFileRoute" },
            { imported: "createFileRoute" }
          ]
        }
      ];
    } else {
      if (ctx.lazy) {
        imports.required = [
          {
            source: targetModule,
            specifiers: [{ imported: "createLazyFileRoute" }]
          }
        ];
        imports.banned = [
          {
            source: targetModule,
            specifiers: [{ imported: "createFileRoute" }]
          }
        ];
      } else {
        imports.required = [
          {
            source: targetModule,
            specifiers: [{ imported: "createFileRoute" }]
          }
        ];
        imports.banned = [
          {
            source: targetModule,
            specifiers: [{ imported: "createLazyFileRoute" }]
          }
        ];
      }
    }
    return imports;
  },
  onExportFound: ({ decl, ctx }) => {
    var _a;
    let appliedChanges = false;
    if (((_a = decl.init) == null ? void 0 : _a.type) === "CallExpression") {
      const callExpression = decl.init;
      let identifier;
      if (callExpression.callee.type === "Identifier") {
        identifier = callExpression.callee;
        if (ctx.verboseFileRoutes) {
          callExpression.callee = b.callExpression(identifier, [
            b.stringLiteral(ctx.routeId)
          ]);
          appliedChanges = true;
        }
      } else if (callExpression.callee.type === "CallExpression" && callExpression.callee.callee.type === "Identifier") {
        identifier = callExpression.callee.callee;
        if (!ctx.verboseFileRoutes) {
          callExpression.callee = identifier;
          appliedChanges = true;
        } else {
          appliedChanges = utils.ensureStringArgument(
            callExpression.callee,
            ctx.routeId,
            ctx.preferredQuote
          );
        }
      }
      if (identifier === void 0) {
        throw new Error(
          `expected identifier to be present in ${ctx.routeId} for export ${EXPORT_NAME}`
        );
      }
      if (identifier.name === "createFileRoute" && ctx.lazy) {
        identifier.name = "createLazyFileRoute";
        appliedChanges = true;
      } else if (identifier.name === "createLazyFileRoute" && !ctx.lazy) {
        identifier.name = "createFileRoute";
        appliedChanges = true;
      }
    }
    return appliedChanges;
  }
};
exports.defaultTransformPlugin = defaultTransformPlugin;
//# sourceMappingURL=default-transform-plugin.cjs.map
