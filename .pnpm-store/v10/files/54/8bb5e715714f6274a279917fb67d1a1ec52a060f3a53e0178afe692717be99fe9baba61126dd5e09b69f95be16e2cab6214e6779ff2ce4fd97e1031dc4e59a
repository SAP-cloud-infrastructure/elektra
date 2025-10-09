var _Symbol = require("core-js/library/fn/symbol/index.js");
var _Symbol$iterator = require("core-js/library/fn/symbol/iterator.js");
var _Array$isArray = require("core-js/library/fn/array/is-array.js");
var unsupportedIterableToArray = require("./unsupportedIterableToArray.js");
function _createForOfIteratorHelper(r, e) {
  var t = "undefined" != typeof _Symbol && r[_Symbol$iterator] || r["@@iterator"];
  if (!t) {
    if (_Array$isArray(r) || (t = unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
      t && (r = t);
      var _n = 0,
        F = function F() {};
      return {
        s: F,
        n: function n() {
          return _n >= r.length ? {
            done: !0
          } : {
            done: !1,
            value: r[_n++]
          };
        },
        e: function e(r) {
          throw r;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var o,
    a = !0,
    u = !1;
  return {
    s: function s() {
      t = t.call(r);
    },
    n: function n() {
      var r = t.next();
      return a = r.done, r;
    },
    e: function e(r) {
      u = !0, o = r;
    },
    f: function f() {
      try {
        a || null == t["return"] || t["return"]();
      } finally {
        if (u) throw o;
      }
    }
  };
}
module.exports = _createForOfIteratorHelper, module.exports.__esModule = true, module.exports["default"] = module.exports;