var _Symbol = require("core-js/library/fn/symbol/index.js");
var _Symbol$iterator = require("core-js/library/fn/symbol/iterator.js");
var _Array$isArray = require("core-js/library/fn/array/is-array.js");
var unsupportedIterableToArray = require("./unsupportedIterableToArray.js");
function _createForOfIteratorHelperLoose(r, e) {
  var t = "undefined" != typeof _Symbol && r[_Symbol$iterator] || r["@@iterator"];
  if (t) return (t = t.call(r)).next.bind(t);
  if (_Array$isArray(r) || (t = unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
    t && (r = t);
    var o = 0;
    return function () {
      return o >= r.length ? {
        done: !0
      } : {
        done: !1,
        value: r[o++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _createForOfIteratorHelperLoose, module.exports.__esModule = true, module.exports["default"] = module.exports;