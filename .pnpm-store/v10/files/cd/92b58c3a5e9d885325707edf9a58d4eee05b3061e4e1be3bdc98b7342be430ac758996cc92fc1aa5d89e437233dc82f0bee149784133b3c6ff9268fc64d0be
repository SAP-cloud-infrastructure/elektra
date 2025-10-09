import _Reflect$get from "core-js/library/fn/reflect/get.js";
import _Object$getOwnPropertyDescriptor from "core-js/library/fn/object/get-own-property-descriptor.js";
import superPropBase from "./superPropBase.js";
function _get() {
  return _get = "undefined" != typeof Reflect && _Reflect$get ? _Reflect$get.bind() : function (e, t, r) {
    var p = superPropBase(e, t);
    if (p) {
      var n = _Object$getOwnPropertyDescriptor(p, t);
      return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
    }
  }, _get.apply(null, arguments);
}
export { _get as default };