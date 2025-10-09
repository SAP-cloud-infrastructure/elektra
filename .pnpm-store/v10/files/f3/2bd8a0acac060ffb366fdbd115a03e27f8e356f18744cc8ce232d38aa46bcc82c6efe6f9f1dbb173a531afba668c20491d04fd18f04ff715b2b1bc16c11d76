import _Symbol from "core-js/library/fn/symbol/index.js";
import _Symbol$for from "core-js/library/fn/symbol/for.js";
function _using(o, n, e) {
  if (null == n) return n;
  if (Object(n) !== n) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
  if (e) var r = n[_Symbol.asyncDispose || _Symbol$for("Symbol.asyncDispose")];
  if (null == r && (r = n[_Symbol.dispose || _Symbol$for("Symbol.dispose")]), "function" != typeof r) throw new TypeError("Property [Symbol.dispose] is not a function.");
  return o.push({
    v: n,
    d: r,
    a: e
  }), n;
}
export { _using as default };