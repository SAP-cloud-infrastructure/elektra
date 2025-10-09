import { jsx } from "react/jsx-runtime";
import * as React from "react";
import { defer, TSR_DEFERRED_PROMISE } from "@tanstack/router-core";
function useAwaited({
  promise: _promise
}) {
  const promise = defer(_promise);
  if (promise[TSR_DEFERRED_PROMISE].status === "pending") {
    throw promise;
  }
  if (promise[TSR_DEFERRED_PROMISE].status === "error") {
    throw promise[TSR_DEFERRED_PROMISE].error;
  }
  return [promise[TSR_DEFERRED_PROMISE].data, promise];
}
function Await(props) {
  const inner = /* @__PURE__ */ jsx(AwaitInner, { ...props });
  if (props.fallback) {
    return /* @__PURE__ */ jsx(React.Suspense, { fallback: props.fallback, children: inner });
  }
  return inner;
}
function AwaitInner(props) {
  const [data] = useAwaited(props);
  return props.children(data);
}
export {
  Await,
  useAwaited
};
//# sourceMappingURL=awaited.js.map
