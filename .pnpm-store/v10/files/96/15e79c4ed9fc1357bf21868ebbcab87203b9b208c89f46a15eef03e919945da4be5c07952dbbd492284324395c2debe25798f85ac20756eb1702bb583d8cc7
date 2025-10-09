"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const headers = require("./headers.cjs");
function json(payload, init) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: headers.mergeHeaders(
      { "content-type": "application/json" },
      init == null ? void 0 : init.headers
    )
  });
}
exports.json = json;
//# sourceMappingURL=json.cjs.map
