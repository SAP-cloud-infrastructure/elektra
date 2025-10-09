import { defaultSerializeError } from "./router.js";
const TSR_DEFERRED_PROMISE = Symbol.for("TSR_DEFERRED_PROMISE");
function defer(_promise, options) {
  const promise = _promise;
  if (promise[TSR_DEFERRED_PROMISE]) {
    return promise;
  }
  promise[TSR_DEFERRED_PROMISE] = { status: "pending" };
  promise.then((data) => {
    promise[TSR_DEFERRED_PROMISE].status = "success";
    promise[TSR_DEFERRED_PROMISE].data = data;
  }).catch((error) => {
    promise[TSR_DEFERRED_PROMISE].status = "error";
    promise[TSR_DEFERRED_PROMISE].error = {
      data: ((options == null ? void 0 : options.serializeError) ?? defaultSerializeError)(error),
      __isServerError: true
    };
  });
  return promise;
}
export {
  TSR_DEFERRED_PROMISE,
  defer
};
//# sourceMappingURL=defer.js.map
