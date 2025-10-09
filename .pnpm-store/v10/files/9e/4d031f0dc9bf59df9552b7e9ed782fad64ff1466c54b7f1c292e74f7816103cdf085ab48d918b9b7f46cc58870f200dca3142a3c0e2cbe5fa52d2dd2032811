"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const history = require("@tanstack/history");
const headers = require("./headers.cjs");
const ssrServer = require("./ssr-server.cjs");
function createRequestHandler({
  createRouter,
  request,
  getRouterManifest
}) {
  return async (cb) => {
    var _a;
    const router = createRouter();
    ssrServer.attachRouterServerSsrUtils(router, await (getRouterManifest == null ? void 0 : getRouterManifest()));
    const url = new URL(request.url, "http://localhost");
    const href = url.href.replace(url.origin, "");
    const history$1 = history.createMemoryHistory({
      initialEntries: [href]
    });
    router.update({
      history: history$1
    });
    await router.load();
    await ((_a = router.serverSsr) == null ? void 0 : _a.dehydrate());
    const responseHeaders = getRequestHeaders({
      router
    });
    return cb({
      request,
      router,
      responseHeaders
    });
  };
}
function getRequestHeaders(opts) {
  let headers$1 = headers.mergeHeaders(
    {
      "Content-Type": "text/html; charset=UTF-8"
    },
    ...opts.router.state.matches.map((match) => {
      return match.headers;
    })
  );
  const { redirect } = opts.router.state;
  if (redirect) {
    headers$1 = headers.mergeHeaders(headers$1, redirect.headers);
  }
  return headers$1;
}
exports.createRequestHandler = createRequestHandler;
//# sourceMappingURL=createRequestHandler.cjs.map
