import { jsx } from "react/jsx-runtime";
import { defineHandlerCallback } from "@tanstack/router-core/ssr/server";
import { renderRouterToString } from "./renderRouterToString.js";
import { RouterServer } from "./RouterServer.js";
const defaultRenderHandler = defineHandlerCallback(
  ({ router, responseHeaders }) => renderRouterToString({
    router,
    responseHeaders,
    children: /* @__PURE__ */ jsx(RouterServer, { router })
  })
);
export {
  defaultRenderHandler
};
//# sourceMappingURL=defaultRenderHandler.js.map
