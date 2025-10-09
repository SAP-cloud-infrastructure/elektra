import _Object$keys from "core-js/library/fn/object/keys.js";
import _Object$getOwnPropertySymbols from "core-js/library/fn/object/get-own-property-symbols.js";
import _Object$getOwnPropertyDescriptor from "core-js/library/fn/object/get-own-property-descriptor.js";
import _Object$getOwnPropertyDescriptors from "core-js/library/fn/object/get-own-property-descriptors.js";
import _Object$defineProperties from "core-js/library/fn/object/define-properties.js";
import _Object$defineProperty from "core-js/library/fn/object/define-property.js";
import defineProperty from "./defineProperty.js";
function ownKeys(e, r) {
  var t = _Object$keys(e);
  if (_Object$getOwnPropertySymbols) {
    var o = _Object$getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return _Object$getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      defineProperty(e, r, t[r]);
    }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(e, _Object$getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      _Object$defineProperty(e, r, _Object$getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
export { _objectSpread2 as default };