"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const useMatch = require("./useMatch.cjs");
function useLoaderData(opts) {
  return useMatch.useMatch({
    from: opts.from,
    strict: opts.strict,
    structuralSharing: opts.structuralSharing,
    select: (s) => {
      return opts.select ? opts.select(s.loaderData) : s.loaderData;
    }
  });
}
exports.useLoaderData = useLoaderData;
//# sourceMappingURL=useLoaderData.cjs.map
