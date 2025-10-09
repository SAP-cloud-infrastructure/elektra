import _Object$keys from "core-js/library/fn/object/keys.js";
import _Object$defineProperty from "core-js/library/fn/object/define-property.js";
function _applyDecoratedDescriptor(i, e, r, n, l) {
  var a = {};
  return _Object$keys(n).forEach(function (i) {
    a[i] = n[i];
  }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) {
    return n(i, e, r) || r;
  }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer && (_Object$defineProperty(i, e, a), a = null), a;
}
export { _applyDecoratedDescriptor as default };