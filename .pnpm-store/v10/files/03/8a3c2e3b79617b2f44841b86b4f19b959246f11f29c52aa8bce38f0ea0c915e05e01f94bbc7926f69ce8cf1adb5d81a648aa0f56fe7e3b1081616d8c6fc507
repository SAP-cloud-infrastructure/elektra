"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const router = require("./router.cjs");
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
      data: ((options == null ? void 0 : options.serializeError) ?? router.defaultSerializeError)(error),
      __isServerError: true
    };
  });
  return promise;
}
exports.TSR_DEFERRED_PROMISE = TSR_DEFERRED_PROMISE;
exports.defer = defer;
//# sourceMappingURL=defer.cjs.map
