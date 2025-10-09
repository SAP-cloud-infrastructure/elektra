import _Object$getOwnPropertySymbols from "core-js/library/fn/object/get-own-property-symbols.js";
import objectWithoutPropertiesLoose from "./objectWithoutPropertiesLoose.js";
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = objectWithoutPropertiesLoose(e, t);
  if (_Object$getOwnPropertySymbols) {
    var n = _Object$getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], t.indexOf(o) >= 0 || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
export { _objectWithoutProperties as default };