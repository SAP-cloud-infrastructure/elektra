var _Object$keys = require("core-js/library/fn/object/keys.js");
var _Object$getOwnPropertySymbols = require("core-js/library/fn/object/get-own-property-symbols.js");
var _Object$getOwnPropertyDescriptor = require("core-js/library/fn/object/get-own-property-descriptor.js");
var _Object$getOwnPropertyDescriptors = require("core-js/library/fn/object/get-own-property-descriptors.js");
var _Object$defineProperties = require("core-js/library/fn/object/define-properties.js");
var _Object$defineProperty = require("core-js/library/fn/object/define-property.js");
var defineProperty = require("./defineProperty.js");
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
module.exports = _objectSpread2, module.exports.__esModule = true, module.exports["default"] = module.exports;