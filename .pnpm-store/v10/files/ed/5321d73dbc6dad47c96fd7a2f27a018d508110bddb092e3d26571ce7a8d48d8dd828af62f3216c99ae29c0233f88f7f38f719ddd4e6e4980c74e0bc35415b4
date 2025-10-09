"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_stream = require("node:stream");
const ReactDOMServer = require("react-dom/server");
const isbot = require("isbot");
const server = require("@tanstack/router-core/ssr/server");
const renderRouterToStream = async ({
  request,
  router,
  responseHeaders,
  children
}) => {
  if (typeof ReactDOMServer.renderToReadableStream === "function") {
    const stream = await ReactDOMServer.renderToReadableStream(children, {
      signal: request.signal
    });
    if (isbot.isbot(request.headers.get("User-Agent"))) {
      await stream.allReady;
    }
    const responseStream = server.transformReadableStreamWithRouter(
      router,
      stream
    );
    return new Response(responseStream, {
      status: router.state.statusCode,
      headers: responseHeaders
    });
  }
  if (typeof ReactDOMServer.renderToPipeableStream === "function") {
    const reactAppPassthrough = new node_stream.PassThrough();
    try {
      const pipeable = ReactDOMServer.renderToPipeableStream(children, {
        ...isbot.isbot(request.headers.get("User-Agent")) ? {
          onAllReady() {
            pipeable.pipe(reactAppPassthrough);
          }
        } : {
          onShellReady() {
            pipeable.pipe(reactAppPassthrough);
          }
        },
        onError: (error, info) => {
          console.error("Error in renderToPipeableStream:", error, info);
        }
      });
    } catch (e) {
      console.error("Error in renderToPipeableStream:", e);
    }
    const responseStream = server.transformPipeableStreamWithRouter(
      router,
      reactAppPassthrough
    );
    return new Response(responseStream, {
      status: router.state.statusCode,
      headers: responseHeaders
    });
  }
  throw new Error(
    "No renderToReadableStream or renderToPipeableStream found in react-dom/server. Ensure you are using a version of react-dom that supports streaming."
  );
};
exports.renderRouterToStream = renderRouterToStream;
//# sourceMappingURL=renderRouterToStream.cjs.map
