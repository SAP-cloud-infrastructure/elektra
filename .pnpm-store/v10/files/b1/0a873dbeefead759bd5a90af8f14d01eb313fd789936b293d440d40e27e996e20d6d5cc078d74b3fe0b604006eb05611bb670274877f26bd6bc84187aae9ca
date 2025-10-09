import { mergeHeaders } from "./headers.js";
function json(payload, init) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: mergeHeaders(
      { "content-type": "application/json" },
      init == null ? void 0 : init.headers
    )
  });
}
export {
  json
};
//# sourceMappingURL=json.js.map
