import { jsx } from "react/jsx-runtime";
import { defineHandlerCallback } from "@tanstack/router-core/ssr/server";
import { RouterServer } from "./RouterServer.js";
import { renderRouterToStream } from "./renderRouterToStream.js";
const defaultStreamHandler = defineHandlerCallback(
  ({ request, router, responseHeaders }) => renderRouterToStream({
    request,
    router,
    responseHeaders,
    children: /* @__PURE__ */ jsx(RouterServer, { router })
  })
);
export {
  defaultStreamHandler
};
//# sourceMappingURL=defaultStreamHandler.js.map
