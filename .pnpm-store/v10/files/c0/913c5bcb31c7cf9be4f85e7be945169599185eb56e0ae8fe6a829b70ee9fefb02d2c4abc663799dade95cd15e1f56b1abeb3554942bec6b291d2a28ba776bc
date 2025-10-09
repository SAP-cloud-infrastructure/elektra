var _typeof = require("./typeof.js")["default"];
var _WeakMap = require("core-js/library/fn/weak-map.js");
var _Object$keys = require("core-js/library/fn/object/keys.js");
var _Object$create = require("core-js/library/fn/object/create.js");
var _Symbol$replace = require("core-js/library/fn/symbol/replace.js");
var _Array$isArray = require("core-js/library/fn/array/is-array.js");
var setPrototypeOf = require("./setPrototypeOf.js");
var inherits = require("./inherits.js");
function _wrapRegExp() {
  module.exports = _wrapRegExp = function _wrapRegExp(e, r) {
    return new BabelRegExp(e, void 0, r);
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  var e = RegExp.prototype,
    r = new _WeakMap();
  function BabelRegExp(e, t, p) {
    var o = RegExp(e, t);
    return r.set(o, p || r.get(e)), setPrototypeOf(o, BabelRegExp.prototype);
  }
  function buildGroups(e, t) {
    var p = r.get(t);
    return _Object$keys(p).reduce(function (r, t) {
      var o = p[t];
      if ("number" == typeof o) r[t] = e[o];else {
        for (var i = 0; void 0 === e[o[i]] && i + 1 < o.length;) i++;
        r[t] = e[o[i]];
      }
      return r;
    }, _Object$create(null));
  }
  return inherits(BabelRegExp, RegExp), BabelRegExp.prototype.exec = function (r) {
    var t = e.exec.call(this, r);
    if (t) {
      t.groups = buildGroups(t, this);
      var p = t.indices;
      p && (p.groups = buildGroups(p, this));
    }
    return t;
  }, BabelRegExp.prototype[_Symbol$replace] = function (t, p) {
    if ("string" == typeof p) {
      var o = r.get(this);
      return e[_Symbol$replace].call(this, t, p.replace(/\$<([^>]+)>/g, function (e, r) {
        var t = o[r];
        return "$" + (_Array$isArray(t) ? t.join("$") : t);
      }));
    }
    if ("function" == typeof p) {
      var i = this;
      return e[_Symbol$replace].call(this, t, function () {
        var e = arguments;
        return "object" != _typeof(e[e.length - 1]) && (e = [].slice.call(e)).push(buildGroups(e, i)), p.apply(this, e);
      });
    }
    return e[_Symbol$replace].call(this, t, p);
  }, _wrapRegExp.apply(this, arguments);
}
module.exports = _wrapRegExp, module.exports.__esModule = true, module.exports["default"] = module.exports;