import { parseAst } from "@tanstack/router-utils";
import { parse, types, print, visit } from "recast";
import { SourceMapConsumer } from "source-map";
import { mergeImportDeclarations } from "../utils.js";
const b = types.builders;
async function transform({
  ctx,
  source,
  plugins
}) {
  var _a, _b, _c, _d;
  let appliedChanges = false;
  let ast;
  const foundExports = [];
  try {
    ast = parse(source, {
      sourceFileName: "output.ts",
      parser: {
        parse(code) {
          return parseAst({
            code,
            // we need to instruct babel to produce tokens,
            // otherwise recast will try to generate the tokens via its own parser and will fail
            tokens: true
          });
        }
      }
    });
  } catch (e) {
    console.error("Error parsing code", ctx.routeId, source, e);
    return {
      result: "error",
      error: e
    };
  }
  const preferredQuote = detectPreferredQuoteStyle(ast);
  const registeredExports = /* @__PURE__ */ new Map();
  for (const plugin of plugins ?? []) {
    const exportName = plugin.exportName;
    if (registeredExports.has(exportName)) {
      throw new Error(
        `Export ${exportName} is already registered by plugin ${(_a = registeredExports.get(exportName)) == null ? void 0 : _a.name}`
      );
    }
    registeredExports.set(exportName, plugin);
  }
  function onExportFound(decl, exportName, plugin) {
    const pluginAppliedChanges = plugin.onExportFound({
      decl,
      ctx: { ...ctx, preferredQuote }
    });
    if (pluginAppliedChanges) {
      appliedChanges = true;
    }
    registeredExports.delete(exportName);
    foundExports.push(exportName);
  }
  const program = ast.program;
  for (const n of program.body) {
    if (registeredExports.size > 0 && n.type === "ExportNamedDeclaration") {
      if (((_b = n.declaration) == null ? void 0 : _b.type) === "VariableDeclaration") {
        const decl = n.declaration.declarations[0];
        if (decl && decl.type === "VariableDeclarator" && decl.id.type === "Identifier") {
          const plugin = registeredExports.get(decl.id.name);
          if (plugin) {
            onExportFound(decl, decl.id.name, plugin);
          }
        }
      } else if (n.declaration === null && n.specifiers) {
        for (const spec of n.specifiers) {
          if (typeof spec.exported.name === "string") {
            const plugin = registeredExports.get(spec.exported.name);
            if (plugin) {
              const variableName = ((_c = spec.local) == null ? void 0 : _c.name) || spec.exported.name;
              for (const decl of program.body) {
                if (decl.type === "VariableDeclaration" && decl.declarations[0]) {
                  const variable = decl.declarations[0];
                  if (variable.type === "VariableDeclarator" && variable.id.type === "Identifier" && variable.id.name === variableName) {
                    onExportFound(variable, spec.exported.name, plugin);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const imports = {
    required: [],
    banned: []
  };
  for (const plugin of plugins ?? []) {
    const exportName = plugin.exportName;
    if (foundExports.includes(exportName)) {
      const pluginImports = plugin.imports(ctx);
      if (pluginImports.required) {
        imports.required.push(...pluginImports.required);
      }
      if (pluginImports.banned) {
        imports.banned.push(...pluginImports.banned);
      }
    }
  }
  imports.required = mergeImportDeclarations(imports.required);
  imports.banned = mergeImportDeclarations(imports.banned);
  const importStatementCandidates = [];
  const importDeclarationsToRemove = [];
  for (const n of program.body) {
    const findImport = (opts) => (i) => {
      if (i.source === opts.source) {
        const importKind = i.importKind || "value";
        const expectedImportKind = opts.importKind || "value";
        return expectedImportKind === importKind;
      }
      return false;
    };
    if (n.type === "ImportDeclaration" && typeof n.source.value === "string") {
      const filterImport = findImport({
        source: n.source.value,
        importKind: n.importKind
      });
      let requiredImports = imports.required.filter(filterImport)[0];
      const bannedImports = imports.banned.filter(filterImport)[0];
      if (!requiredImports && !bannedImports) {
        continue;
      }
      const importSpecifiersToRemove = [];
      if (n.specifiers) {
        for (const spec of n.specifiers) {
          if (!requiredImports && !bannedImports) {
            break;
          }
          if (spec.type === "ImportSpecifier" && typeof spec.imported.name === "string") {
            if (requiredImports) {
              const requiredImportIndex = requiredImports.specifiers.findIndex(
                (imp) => imp.imported === spec.imported.name
              );
              if (requiredImportIndex !== -1) {
                requiredImports.specifiers.splice(requiredImportIndex, 1);
                if (requiredImports.specifiers.length === 0) {
                  imports.required = imports.required.splice(
                    imports.required.indexOf(requiredImports),
                    1
                  );
                  requiredImports = void 0;
                }
              } else {
                importStatementCandidates.push(n);
              }
            }
            if (bannedImports) {
              const bannedImportIndex = bannedImports.specifiers.findIndex(
                (imp) => imp.imported === spec.imported.name
              );
              if (bannedImportIndex !== -1) {
                importSpecifiersToRemove.push(spec);
              }
            }
          }
        }
        if (importSpecifiersToRemove.length > 0) {
          appliedChanges = true;
          n.specifiers = n.specifiers.filter(
            (spec) => !importSpecifiersToRemove.includes(spec)
          );
          if (n.specifiers.length === 0) {
            importDeclarationsToRemove.push(n);
          }
        }
      }
    }
  }
  imports.required.forEach((requiredImport) => {
    if (requiredImport.specifiers.length > 0) {
      appliedChanges = true;
      if (importStatementCandidates.length > 0) {
        const importStatement2 = importStatementCandidates.find(
          (importStatement3) => {
            if (importStatement3.source.value === requiredImport.source) {
              const importKind = importStatement3.importKind || "value";
              const requiredImportKind = requiredImport.importKind || "value";
              return importKind === requiredImportKind;
            }
            return false;
          }
        );
        if (importStatement2) {
          if (importStatement2.specifiers === void 0) {
            importStatement2.specifiers = [];
          }
          const importSpecifiersToAdd = requiredImport.specifiers.map(
            (spec) => b.importSpecifier(
              b.identifier(spec.imported),
              b.identifier(spec.imported)
            )
          );
          importStatement2.specifiers = [
            ...importStatement2.specifiers,
            ...importSpecifiersToAdd
          ];
          return;
        }
      }
      const importStatement = b.importDeclaration(
        requiredImport.specifiers.map(
          (spec) => b.importSpecifier(
            b.identifier(spec.imported),
            spec.local ? b.identifier(spec.local) : null
          )
        ),
        b.stringLiteral(requiredImport.source)
      );
      program.body.unshift(importStatement);
    }
  });
  if (importDeclarationsToRemove.length > 0) {
    appliedChanges = true;
    for (const importDeclaration of importDeclarationsToRemove) {
      if (((_d = importDeclaration.specifiers) == null ? void 0 : _d.length) === 0) {
        const index = program.body.indexOf(importDeclaration);
        if (index !== -1) {
          program.body.splice(index, 1);
        }
      }
    }
  }
  if (!appliedChanges) {
    return {
      exports: foundExports,
      result: "not-modified"
    };
  }
  const printResult = print(ast, {
    reuseWhitespace: true,
    sourceMapName: "output.map"
  });
  let transformedCode = printResult.code;
  if (printResult.map) {
    const fixedOutput = await fixTransformedOutputText({
      originalCode: source,
      transformedCode,
      sourceMap: printResult.map,
      preferredQuote
    });
    transformedCode = fixedOutput;
  }
  return {
    result: "modified",
    exports: foundExports,
    output: transformedCode
  };
}
async function fixTransformedOutputText({
  originalCode,
  transformedCode,
  sourceMap,
  preferredQuote
}) {
  const originalLines = originalCode.split("\n");
  const transformedLines = transformedCode.split("\n");
  const defaultUsesSemicolons = detectSemicolonUsage(originalCode);
  const consumer = await new SourceMapConsumer(sourceMap);
  const fixedLines = transformedLines.map((line, i) => {
    const transformedLineNum = i + 1;
    let origLineText = void 0;
    for (let col = 0; col < line.length; col++) {
      const mapped = consumer.originalPositionFor({
        line: transformedLineNum,
        column: col
      });
      if (mapped.line != null && mapped.line > 0) {
        origLineText = originalLines[mapped.line - 1];
        break;
      }
    }
    if (origLineText !== void 0) {
      if (origLineText === line) {
        return origLineText;
      }
      return fixLine(line, {
        originalLine: origLineText,
        useOriginalSemicolon: true,
        useOriginalQuotes: true,
        fallbackQuote: preferredQuote
      });
    } else {
      return fixLine(line, {
        originalLine: null,
        useOriginalSemicolon: false,
        useOriginalQuotes: false,
        fallbackQuote: preferredQuote,
        fallbackSemicolon: defaultUsesSemicolons
      });
    }
  });
  return fixedLines.join("\n");
}
function fixLine(line, {
  originalLine,
  useOriginalSemicolon,
  useOriginalQuotes,
  fallbackQuote,
  fallbackSemicolon = true
}) {
  let result = line;
  if (useOriginalQuotes && originalLine) {
    result = fixQuotes(result, originalLine, fallbackQuote);
  } else if (!useOriginalQuotes && fallbackQuote) {
    result = fixQuotesToPreferred(result, fallbackQuote);
  }
  if (useOriginalSemicolon && originalLine) {
    const hadSemicolon = originalLine.trimEnd().endsWith(";");
    const hasSemicolon = result.trimEnd().endsWith(";");
    if (hadSemicolon && !hasSemicolon) result += ";";
    if (!hadSemicolon && hasSemicolon) result = result.replace(/;\s*$/, "");
  } else if (!useOriginalSemicolon) {
    const hasSemicolon = result.trimEnd().endsWith(";");
    if (!fallbackSemicolon && hasSemicolon) result = result.replace(/;\s*$/, "");
    if (fallbackSemicolon && !hasSemicolon && result.trim()) result += ";";
  }
  return result;
}
function fixQuotes(line, originalLine, fallbackQuote) {
  let originalQuote = detectQuoteFromLine(originalLine);
  if (!originalQuote) {
    originalQuote = fallbackQuote;
  }
  return fixQuotesToPreferred(line, originalQuote);
}
function fixQuotesToPreferred(line, quote) {
  return line.replace(
    /(['"`])([^'"`\\]*(?:\\.[^'"`\\]*)*)\1/g,
    (_, q, content) => {
      const escaped = content.replaceAll(quote, `\\${quote}`);
      return `${quote}${escaped}${quote}`;
    }
  );
}
function detectQuoteFromLine(line) {
  const match = line.match(/(['"`])(?:\\.|[^\\])*?\1/);
  return match ? match[1] : null;
}
function detectSemicolonUsage(code) {
  const lines = code.split("\n").map((l) => l.trim());
  const total = lines.length;
  const withSemis = lines.filter((l) => l.endsWith(";")).length;
  return withSemis > total / 2;
}
function detectPreferredQuoteStyle(ast) {
  let single = 0;
  let double = 0;
  visit(ast, {
    visitStringLiteral(path) {
      var _a;
      if (path.parent.node.type !== "JSXAttribute") {
        const raw = (_a = path.node.extra) == null ? void 0 : _a.raw;
        if (raw == null ? void 0 : raw.startsWith("'")) single++;
        else if (raw == null ? void 0 : raw.startsWith('"')) double++;
      }
      return false;
    }
  });
  if (single >= double) {
    return "'";
  }
  return '"';
}
export {
  detectPreferredQuoteStyle,
  transform
};
//# sourceMappingURL=transform.js.map
