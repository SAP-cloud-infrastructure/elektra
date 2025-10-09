"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const useMatch = require("./useMatch.cjs");
function useParams(opts) {
  return useMatch.useMatch({
    from: opts.from,
    strict: opts.strict,
    shouldThrow: opts.shouldThrow,
    structuralSharing: opts.structuralSharing,
    select: (match) => {
      return opts.select ? opts.select(match.params) : match.params;
    }
  });
}
exports.useParams = useParams;
//# sourceMappingURL=useParams.cjs.map
