"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const routerCore = require("@tanstack/router-core");
const fileRoute = require("./fileRoute.cjs");
const createRouter = (options) => {
  return new Router(options);
};
class Router extends routerCore.RouterCore {
  constructor(options) {
    super(options);
  }
}
if (typeof globalThis !== "undefined") {
  globalThis.createFileRoute = fileRoute.createFileRoute;
  globalThis.createLazyFileRoute = fileRoute.createLazyFileRoute;
} else if (typeof window !== "undefined") {
  window.createFileRoute = fileRoute.createFileRoute;
  window.createLazyFileRoute = fileRoute.createLazyFileRoute;
}
exports.Router = Router;
exports.createRouter = createRouter;
//# sourceMappingURL=router.cjs.map
