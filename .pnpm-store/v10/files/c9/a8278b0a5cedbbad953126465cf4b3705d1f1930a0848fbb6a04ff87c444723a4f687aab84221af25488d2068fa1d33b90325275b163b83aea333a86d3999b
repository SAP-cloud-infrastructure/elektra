import { jsx } from "react/jsx-runtime";
import { hydrate } from "@tanstack/router-core/ssr/client";
import { Await } from "../awaited.js";
import { RouterProvider } from "../RouterProvider.js";
let hydrationPromise;
function RouterClient(props) {
  if (!hydrationPromise) {
    if (!props.router.state.matches.length) {
      hydrationPromise = hydrate(props.router);
    } else {
      hydrationPromise = Promise.resolve();
    }
  }
  return /* @__PURE__ */ jsx(
    Await,
    {
      promise: hydrationPromise,
      children: () => /* @__PURE__ */ jsx(RouterProvider, { router: props.router })
    }
  );
}
export {
  RouterClient
};
//# sourceMappingURL=RouterClient.js.map
