"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const parser = require("@babel/parser");
const _generate = require("@babel/generator");
function parseAst({
  code,
  ...opts
}) {
  return parser.parse(code, {
    plugins: ["jsx", "typescript", "explicitResourceManagement"],
    sourceType: "module",
    ...opts
  });
}
let generate = _generate;
if ("default" in generate) {
  generate = generate.default;
}
function generateFromAst(ast, opts) {
  return generate(
    ast,
    opts ? { importAttributesKeyword: "with", sourceMaps: true, ...opts } : void 0
  );
}
exports.generateFromAst = generateFromAst;
exports.parseAst = parseAst;
//# sourceMappingURL=ast.cjs.map
