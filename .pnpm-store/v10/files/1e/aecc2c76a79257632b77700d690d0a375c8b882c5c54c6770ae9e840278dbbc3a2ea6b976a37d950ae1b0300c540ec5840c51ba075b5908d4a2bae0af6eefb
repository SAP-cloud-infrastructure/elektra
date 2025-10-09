import { RouterCore } from "@tanstack/router-core";
import { createFileRoute, createLazyFileRoute } from "./fileRoute.js";
const createRouter = (options) => {
  return new Router(options);
};
class Router extends RouterCore {
  constructor(options) {
    super(options);
  }
}
if (typeof globalThis !== "undefined") {
  globalThis.createFileRoute = createFileRoute;
  globalThis.createLazyFileRoute = createLazyFileRoute;
} else if (typeof window !== "undefined") {
  window.createFileRoute = createFileRoute;
  window.createLazyFileRoute = createLazyFileRoute;
}
export {
  Router,
  createRouter
};
//# sourceMappingURL=router.js.map
