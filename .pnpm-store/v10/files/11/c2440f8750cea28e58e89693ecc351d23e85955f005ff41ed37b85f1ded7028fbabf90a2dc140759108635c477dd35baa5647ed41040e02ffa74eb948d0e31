"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const useMatch = require("./useMatch.cjs");
function useRouteContext(opts) {
  return useMatch.useMatch({
    ...opts,
    select: (match) => opts.select ? opts.select(match.context) : match.context
  });
}
exports.useRouteContext = useRouteContext;
//# sourceMappingURL=useRouteContext.cjs.map
