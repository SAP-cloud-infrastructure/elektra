"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const RouterServer = require("./RouterServer.cjs");
const defaultRenderHandler = require("./defaultRenderHandler.cjs");
const defaultStreamHandler = require("./defaultStreamHandler.cjs");
const renderRouterToStream = require("./renderRouterToStream.cjs");
const renderRouterToString = require("./renderRouterToString.cjs");
const server = require("@tanstack/router-core/ssr/server");
exports.RouterServer = RouterServer.RouterServer;
exports.defaultRenderHandler = defaultRenderHandler.defaultRenderHandler;
exports.defaultStreamHandler = defaultStreamHandler.defaultStreamHandler;
exports.renderRouterToStream = renderRouterToStream.renderRouterToStream;
exports.renderRouterToString = renderRouterToString.renderRouterToString;
Object.keys(server).forEach((k) => {
  if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: () => server[k]
  });
});
//# sourceMappingURL=server.cjs.map
