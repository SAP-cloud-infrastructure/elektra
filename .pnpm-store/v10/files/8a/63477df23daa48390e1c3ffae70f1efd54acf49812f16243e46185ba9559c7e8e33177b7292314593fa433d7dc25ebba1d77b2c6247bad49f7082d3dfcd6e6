import { parse } from "@babel/parser";
import _generate from "@babel/generator";
function parseAst({
  code,
  ...opts
}) {
  return parse(code, {
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
export {
  generateFromAst,
  parseAst
};
//# sourceMappingURL=ast.js.map
