import * as React from "react";
import warning from "tiny-warning";
import { getRouterContext } from "./routerContext.js";
function useRouter(opts) {
  const value = React.useContext(getRouterContext());
  warning(
    !(((opts == null ? void 0 : opts.warn) ?? true) && !value),
    "useRouter must be used inside a <RouterProvider> component!"
  );
  return value;
}
export {
  useRouter
};
//# sourceMappingURL=useRouter.js.map
