import { createMemoryHistory } from "@tanstack/history";
import { mergeHeaders } from "./headers.js";
import { attachRouterServerSsrUtils } from "./ssr-server.js";
function createRequestHandler({
  createRouter,
  request,
  getRouterManifest
}) {
  return async (cb) => {
    var _a;
    const router = createRouter();
    attachRouterServerSsrUtils(router, await (getRouterManifest == null ? void 0 : getRouterManifest()));
    const url = new URL(request.url, "http://localhost");
    const href = url.href.replace(url.origin, "");
    const history = createMemoryHistory({
      initialEntries: [href]
    });
    router.update({
      history
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
  let headers = mergeHeaders(
    {
      "Content-Type": "text/html; charset=UTF-8"
    },
    ...opts.router.state.matches.map((match) => {
      return match.headers;
    })
  );
  const { redirect } = opts.router.state;
  if (redirect) {
    headers = mergeHeaders(headers, redirect.headers);
  }
  return headers;
}
export {
  createRequestHandler
};
//# sourceMappingURL=createRequestHandler.js.map
