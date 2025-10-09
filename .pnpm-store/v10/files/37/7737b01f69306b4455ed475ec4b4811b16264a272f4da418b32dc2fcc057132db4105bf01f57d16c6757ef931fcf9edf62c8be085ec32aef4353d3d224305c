"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const useMatch = require("./useMatch.cjs");
function useLoaderDeps(opts) {
  const { select, ...rest } = opts;
  return useMatch.useMatch({
    ...rest,
    select: (s) => {
      return select ? select(s.loaderDeps) : s.loaderDeps;
    }
  });
}
exports.useLoaderDeps = useLoaderDeps;
//# sourceMappingURL=useLoaderDeps.cjs.map
