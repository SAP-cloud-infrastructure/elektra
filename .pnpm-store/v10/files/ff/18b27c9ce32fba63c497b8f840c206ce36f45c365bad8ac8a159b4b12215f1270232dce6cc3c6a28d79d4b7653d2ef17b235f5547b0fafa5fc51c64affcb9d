"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const server = require("@tanstack/router-core/ssr/server");
const RouterServer = require("./RouterServer.cjs");
const renderRouterToStream = require("./renderRouterToStream.cjs");
const defaultStreamHandler = server.defineHandlerCallback(
  ({ request, router, responseHeaders }) => renderRouterToStream.renderRouterToStream({
    request,
    router,
    responseHeaders,
    children: /* @__PURE__ */ jsxRuntime.jsx(RouterServer.RouterServer, { router })
  })
);
exports.defaultStreamHandler = defaultStreamHandler;
//# sourceMappingURL=defaultStreamHandler.cjs.map
