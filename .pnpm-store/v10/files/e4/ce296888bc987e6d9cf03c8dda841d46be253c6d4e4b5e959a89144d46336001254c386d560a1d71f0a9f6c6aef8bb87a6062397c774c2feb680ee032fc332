"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function redirect(opts) {
  opts.statusCode = opts.statusCode || opts.code || 307;
  if (!opts.reloadDocument) {
    try {
      new URL(`${opts.href}`);
      opts.reloadDocument = true;
    } catch {
    }
  }
  const headers = new Headers(opts.headers || {});
  if (opts.href && headers.get("Location") === null) {
    headers.set("Location", opts.href);
  }
  const response = new Response(null, {
    status: opts.statusCode,
    headers
  });
  response.options = opts;
  if (opts.throw) {
    throw response;
  }
  return response;
}
function isRedirect(obj) {
  return obj instanceof Response && !!obj.options;
}
function isResolvedRedirect(obj) {
  return isRedirect(obj) && !!obj.options.href;
}
function parseRedirect(obj) {
  if (typeof obj === "object" && obj.isSerializedRedirect) {
    return redirect(obj);
  }
  return void 0;
}
exports.isRedirect = isRedirect;
exports.isResolvedRedirect = isResolvedRedirect;
exports.parseRedirect = parseRedirect;
exports.redirect = redirect;
//# sourceMappingURL=redirect.cjs.map
