"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const client = require("@tanstack/router-core/ssr/client");
const awaited = require("../awaited.cjs");
const RouterProvider = require("../RouterProvider.cjs");
let hydrationPromise;
function RouterClient(props) {
  if (!hydrationPromise) {
    if (!props.router.state.matches.length) {
      hydrationPromise = client.hydrate(props.router);
    } else {
      hydrationPromise = Promise.resolve();
    }
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
    awaited.Await,
    {
      promise: hydrationPromise,
      children: () => /* @__PURE__ */ jsxRuntime.jsx(RouterProvider.RouterProvider, { router: props.router })
    }
  );
}
exports.RouterClient = RouterClient;
//# sourceMappingURL=RouterClient.cjs.map
