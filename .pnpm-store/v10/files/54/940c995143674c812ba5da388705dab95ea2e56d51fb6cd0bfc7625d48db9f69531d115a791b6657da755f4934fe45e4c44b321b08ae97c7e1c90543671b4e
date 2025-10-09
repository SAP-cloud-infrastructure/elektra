"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const server = require("@tanstack/router-core/ssr/server");
const renderRouterToString = require("./renderRouterToString.cjs");
const RouterServer = require("./RouterServer.cjs");
const defaultRenderHandler = server.defineHandlerCallback(
  ({ router, responseHeaders }) => renderRouterToString.renderRouterToString({
    router,
    responseHeaders,
    children: /* @__PURE__ */ jsxRuntime.jsx(RouterServer.RouterServer, { router })
  })
);
exports.defaultRenderHandler = defaultRenderHandler;
//# sourceMappingURL=defaultRenderHandler.cjs.map
