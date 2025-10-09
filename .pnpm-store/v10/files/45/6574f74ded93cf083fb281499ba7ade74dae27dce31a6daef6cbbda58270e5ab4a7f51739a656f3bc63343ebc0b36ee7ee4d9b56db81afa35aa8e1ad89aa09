(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('jss')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'jss'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.reactJss = {}, global.React, global.jss));
}(this, (function (exports, React, jss) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  		path: basedir,
  		exports: {},
  		require: function (path, base) {
  			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  		}
  	}, fn(module, module.exports), module.exports;
  }

  function getAugmentedNamespace(n) {
  	if (n.__esModule) return n;
  	var a = Object.defineProperty({}, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var reactIs_production_min = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports,"__esModule",{value:!0});
  var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.concurrent_mode"):60111,m=b?Symbol.for("react.forward_ref"):60112,n=b?Symbol.for("react.suspense"):60113,q=b?Symbol.for("react.memo"):60115,r=b?Symbol.for("react.lazy"):
  60116;function t(a){if("object"===typeof a&&null!==a){var p=a.$$typeof;switch(p){case c:switch(a=a.type,a){case l:case e:case g:case f:return a;default:switch(a=a&&a.$$typeof,a){case k:case m:case h:return a;default:return p}}case d:return p}}}function u(a){return t(a)===l}exports.typeOf=t;exports.AsyncMode=l;exports.ConcurrentMode=l;exports.ContextConsumer=k;exports.ContextProvider=h;exports.Element=c;exports.ForwardRef=m;exports.Fragment=e;exports.Profiler=g;exports.Portal=d;
  exports.StrictMode=f;exports.isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===l||a===g||a===f||a===n||"object"===typeof a&&null!==a&&(a.$$typeof===r||a.$$typeof===q||a.$$typeof===h||a.$$typeof===k||a.$$typeof===m)};exports.isAsyncMode=function(a){return u(a)};exports.isConcurrentMode=u;exports.isContextConsumer=function(a){return t(a)===k};exports.isContextProvider=function(a){return t(a)===h};
  exports.isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};exports.isForwardRef=function(a){return t(a)===m};exports.isFragment=function(a){return t(a)===e};exports.isProfiler=function(a){return t(a)===g};exports.isPortal=function(a){return t(a)===d};exports.isStrictMode=function(a){return t(a)===f};
  });

  var reactIs_development = createCommonjsModule(function (module, exports) {



  {
    (function() {

  Object.defineProperty(exports, '__esModule', { value: true });

  // The Symbol used to tag the ReactElement-like types. If there is no native Symbol
  // nor polyfill, then a plain number is used for performance.
  var hasSymbol = typeof Symbol === 'function' && Symbol.for;

  var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
  var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
  var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
  var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
  var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
  var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
  var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace;
  var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
  var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
  var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
  var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
  var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;

  function isValidElementType(type) {
    return typeof type === 'string' || typeof type === 'function' ||
    // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
    type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE);
  }

  /**
   * Forked from fbjs/warning:
   * https://github.com/facebook/fbjs/blob/e66ba20ad5be433eb54423f2b097d829324d9de6/packages/fbjs/src/__forks__/warning.js
   *
   * Only change is we use console.warn instead of console.error,
   * and do nothing when 'console' is not supported.
   * This really simplifies the code.
   * ---
   * Similar to invariant but only logs a warning if the condition is not met.
   * This can be used to log issues in development environments in critical
   * paths. Removing the logging code for production environments will keep the
   * same logic and follow the same code paths.
   */

  var lowPriorityWarning = function () {};

  {
    var printWarning = function (format) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argIndex = 0;
      var message = 'Warning: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      });
      if (typeof console !== 'undefined') {
        console.warn(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };

    lowPriorityWarning = function (condition, format) {
      if (format === undefined) {
        throw new Error('`lowPriorityWarning(condition, format, ...args)` requires a warning ' + 'message argument');
      }
      if (!condition) {
        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }

        printWarning.apply(undefined, [format].concat(args));
      }
    };
  }

  var lowPriorityWarning$1 = lowPriorityWarning;

  function typeOf(object) {
    if (typeof object === 'object' && object !== null) {
      var $$typeof = object.$$typeof;

      switch ($$typeof) {
        case REACT_ELEMENT_TYPE:
          var type = object.type;

          switch (type) {
            case REACT_CONCURRENT_MODE_TYPE:
            case REACT_FRAGMENT_TYPE:
            case REACT_PROFILER_TYPE:
            case REACT_STRICT_MODE_TYPE:
              return type;
            default:
              var $$typeofType = type && type.$$typeof;

              switch ($$typeofType) {
                case REACT_CONTEXT_TYPE:
                case REACT_FORWARD_REF_TYPE:
                case REACT_PROVIDER_TYPE:
                  return $$typeofType;
                default:
                  return $$typeof;
              }
          }
        case REACT_PORTAL_TYPE:
          return $$typeof;
      }
    }

    return undefined;
  }

  // AsyncMode alias is deprecated along with isAsyncMode
  var AsyncMode = REACT_CONCURRENT_MODE_TYPE;
  var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
  var ContextConsumer = REACT_CONTEXT_TYPE;
  var ContextProvider = REACT_PROVIDER_TYPE;
  var Element = REACT_ELEMENT_TYPE;
  var ForwardRef = REACT_FORWARD_REF_TYPE;
  var Fragment = REACT_FRAGMENT_TYPE;
  var Profiler = REACT_PROFILER_TYPE;
  var Portal = REACT_PORTAL_TYPE;
  var StrictMode = REACT_STRICT_MODE_TYPE;

  var hasWarnedAboutDeprecatedIsAsyncMode = false;

  // AsyncMode should be deprecated
  function isAsyncMode(object) {
    {
      if (!hasWarnedAboutDeprecatedIsAsyncMode) {
        hasWarnedAboutDeprecatedIsAsyncMode = true;
        lowPriorityWarning$1(false, 'The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
      }
    }
    return isConcurrentMode(object);
  }
  function isConcurrentMode(object) {
    return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
  }
  function isContextConsumer(object) {
    return typeOf(object) === REACT_CONTEXT_TYPE;
  }
  function isContextProvider(object) {
    return typeOf(object) === REACT_PROVIDER_TYPE;
  }
  function isElement(object) {
    return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
  }
  function isForwardRef(object) {
    return typeOf(object) === REACT_FORWARD_REF_TYPE;
  }
  function isFragment(object) {
    return typeOf(object) === REACT_FRAGMENT_TYPE;
  }
  function isProfiler(object) {
    return typeOf(object) === REACT_PROFILER_TYPE;
  }
  function isPortal(object) {
    return typeOf(object) === REACT_PORTAL_TYPE;
  }
  function isStrictMode(object) {
    return typeOf(object) === REACT_STRICT_MODE_TYPE;
  }

  exports.typeOf = typeOf;
  exports.AsyncMode = AsyncMode;
  exports.ConcurrentMode = ConcurrentMode;
  exports.ContextConsumer = ContextConsumer;
  exports.ContextProvider = ContextProvider;
  exports.Element = Element;
  exports.ForwardRef = ForwardRef;
  exports.Fragment = Fragment;
  exports.Profiler = Profiler;
  exports.Portal = Portal;
  exports.StrictMode = StrictMode;
  exports.isValidElementType = isValidElementType;
  exports.isAsyncMode = isAsyncMode;
  exports.isConcurrentMode = isConcurrentMode;
  exports.isContextConsumer = isContextConsumer;
  exports.isContextProvider = isContextProvider;
  exports.isElement = isElement;
  exports.isForwardRef = isForwardRef;
  exports.isFragment = isFragment;
  exports.isProfiler = isProfiler;
  exports.isPortal = isPortal;
  exports.isStrictMode = isStrictMode;
    })();
  }
  });

  var reactIs = createCommonjsModule(function (module) {

  {
    module.exports = reactIs_development;
  }
  });

  /**
   * Copyright 2015, Yahoo! Inc.
   * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
   */

  var REACT_STATICS = {
      childContextTypes: true,
      contextType: true,
      contextTypes: true,
      defaultProps: true,
      displayName: true,
      getDefaultProps: true,
      getDerivedStateFromError: true,
      getDerivedStateFromProps: true,
      mixins: true,
      propTypes: true,
      type: true
  };

  var KNOWN_STATICS = {
      name: true,
      length: true,
      prototype: true,
      caller: true,
      callee: true,
      arguments: true,
      arity: true
  };

  var FORWARD_REF_STATICS = {
      '$$typeof': true,
      render: true
  };

  var TYPE_STATICS = {};
  TYPE_STATICS[reactIs.ForwardRef] = FORWARD_REF_STATICS;

  var defineProperty = Object.defineProperty;
  var getOwnPropertyNames = Object.getOwnPropertyNames;
  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var getPrototypeOf = Object.getPrototypeOf;
  var objectPrototype = Object.prototype;

  function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
      if (typeof sourceComponent !== 'string') {
          // don't hoist over string (html) components

          if (objectPrototype) {
              var inheritedComponent = getPrototypeOf(sourceComponent);
              if (inheritedComponent && inheritedComponent !== objectPrototype) {
                  hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
              }
          }

          var keys = getOwnPropertyNames(sourceComponent);

          if (getOwnPropertySymbols) {
              keys = keys.concat(getOwnPropertySymbols(sourceComponent));
          }

          var targetStatics = TYPE_STATICS[targetComponent['$$typeof']] || REACT_STATICS;
          var sourceStatics = TYPE_STATICS[sourceComponent['$$typeof']] || REACT_STATICS;

          for (var i = 0; i < keys.length; ++i) {
              var key = keys[i];
              if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
                  var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
                  try {
                      // Avoid failures from read-only properties
                      defineProperty(targetComponent, key, descriptor);
                  } catch (e) {}
              }
          }

          return targetComponent;
      }

      return targetComponent;
  }

  var hoistNonReactStatics_cjs = hoistNonReactStatics;

  function warning(condition, message) {
    {
      if (condition) {
        return;
      }

      var text = "Warning: " + message;

      if (typeof console !== 'undefined') {
        console.warn(text);
      }

      try {
        throw Error(text);
      } catch (x) {}
    }
  }

  /*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  */
  /* eslint-disable no-unused-vars */
  var getOwnPropertySymbols$1 = Object.getOwnPropertySymbols;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;

  function toObject(val) {
  	if (val === null || val === undefined) {
  		throw new TypeError('Object.assign cannot be called with null or undefined');
  	}

  	return Object(val);
  }

  function shouldUseNative() {
  	try {
  		if (!Object.assign) {
  			return false;
  		}

  		// Detect buggy property enumeration order in older V8 versions.

  		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
  		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
  		test1[5] = 'de';
  		if (Object.getOwnPropertyNames(test1)[0] === '5') {
  			return false;
  		}

  		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
  		var test2 = {};
  		for (var i = 0; i < 10; i++) {
  			test2['_' + String.fromCharCode(i)] = i;
  		}
  		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
  			return test2[n];
  		});
  		if (order2.join('') !== '0123456789') {
  			return false;
  		}

  		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
  		var test3 = {};
  		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
  			test3[letter] = letter;
  		});
  		if (Object.keys(Object.assign({}, test3)).join('') !==
  				'abcdefghijklmnopqrst') {
  			return false;
  		}

  		return true;
  	} catch (err) {
  		// We don't expect any of the above to throw, but better to be safe.
  		return false;
  	}
  }

  module.exports = shouldUseNative() ? Object.assign : function (target, source) {
  	var from;
  	var to = toObject(target);
  	var symbols;

  	for (var s = 1; s < arguments.length; s++) {
  		from = Object(arguments[s]);

  		for (var key in from) {
  			if (hasOwnProperty.call(from, key)) {
  				to[key] = from[key];
  			}
  		}

  		if (getOwnPropertySymbols$1) {
  			symbols = getOwnPropertySymbols$1(from);
  			for (var i = 0; i < symbols.length; i++) {
  				if (propIsEnumerable.call(from, symbols[i])) {
  					to[symbols[i]] = from[symbols[i]];
  				}
  			}
  		}
  	}

  	return to;
  };

  var objectAssign = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

  var ReactPropTypesSecret_1 = ReactPropTypesSecret;

  var printWarning = function() {};

  {
    var ReactPropTypesSecret$1 = ReactPropTypesSecret_1;
    var loggedTypeFailures = {};

    printWarning = function(text) {
      var message = 'Warning: ' + text;
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };
  }

  /**
   * Assert that the values match with the type specs.
   * Error messages are memorized and will only be shown once.
   *
   * @param {object} typeSpecs Map of name to a ReactPropType
   * @param {object} values Runtime values that need to be type-checked
   * @param {string} location e.g. "prop", "context", "child context"
   * @param {string} componentName Name of the component for error messages.
   * @param {?Function} getStack Returns the component stack.
   * @private
   */
  function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
    {
      for (var typeSpecName in typeSpecs) {
        if (typeSpecs.hasOwnProperty(typeSpecName)) {
          var error;
          // Prop type validation may throw. In case they do, we don't want to
          // fail the render phase where it didn't fail before. So we log it.
          // After these have been cleaned up, we'll let them throw.
          try {
            // This is intentionally an invariant that gets caught. It's the same
            // behavior as without this statement except with a better message.
            if (typeof typeSpecs[typeSpecName] !== 'function') {
              var err = Error(
                (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
                'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.'
              );
              err.name = 'Invariant Violation';
              throw err;
            }
            error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret$1);
          } catch (ex) {
            error = ex;
          }
          if (error && !(error instanceof Error)) {
            printWarning(
              (componentName || 'React class') + ': type specification of ' +
              location + ' `' + typeSpecName + '` is invalid; the type checker ' +
              'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
              'You may have forgotten to pass an argument to the type checker ' +
              'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
              'shape all require an argument).'
            );

          }
          if (error instanceof Error && !(error.message in loggedTypeFailures)) {
            // Only monitor this failure once because there tends to be a lot of the
            // same error.
            loggedTypeFailures[error.message] = true;

            var stack = getStack ? getStack() : '';

            printWarning(
              'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
            );
          }
        }
      }
    }
  }

  var checkPropTypes_1 = checkPropTypes;

  var assign = /*@__PURE__*/getAugmentedNamespace(objectAssign);

  var printWarning$1 = function() {};

  {
    printWarning$1 = function(text) {
      var message = 'Warning: ' + text;
      if (typeof console !== 'undefined') {
        console.error(message);
      }
      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        throw new Error(message);
      } catch (x) {}
    };
  }

  function emptyFunctionThatReturnsNull() {
    return null;
  }

  var factoryWithTypeCheckers = function(isValidElement, throwOnDirectAccess) {
    /* global Symbol */
    var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
    var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

    /**
     * Returns the iterator method function contained on the iterable object.
     *
     * Be sure to invoke the function with the iterable as context:
     *
     *     var iteratorFn = getIteratorFn(myIterable);
     *     if (iteratorFn) {
     *       var iterator = iteratorFn.call(myIterable);
     *       ...
     *     }
     *
     * @param {?object} maybeIterable
     * @return {?function}
     */
    function getIteratorFn(maybeIterable) {
      var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
      if (typeof iteratorFn === 'function') {
        return iteratorFn;
      }
    }

    /**
     * Collection of methods that allow declaration and validation of props that are
     * supplied to React components. Example usage:
     *
     *   var Props = require('ReactPropTypes');
     *   var MyArticle = React.createClass({
     *     propTypes: {
     *       // An optional string prop named "description".
     *       description: Props.string,
     *
     *       // A required enum prop named "category".
     *       category: Props.oneOf(['News','Photos']).isRequired,
     *
     *       // A prop named "dialog" that requires an instance of Dialog.
     *       dialog: Props.instanceOf(Dialog).isRequired
     *     },
     *     render: function() { ... }
     *   });
     *
     * A more formal specification of how these methods are used:
     *
     *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
     *   decl := ReactPropTypes.{type}(.isRequired)?
     *
     * Each and every declaration produces a function with the same signature. This
     * allows the creation of custom validation functions. For example:
     *
     *  var MyLink = React.createClass({
     *    propTypes: {
     *      // An optional string or URI prop named "href".
     *      href: function(props, propName, componentName) {
     *        var propValue = props[propName];
     *        if (propValue != null && typeof propValue !== 'string' &&
     *            !(propValue instanceof URI)) {
     *          return new Error(
     *            'Expected a string or an URI for ' + propName + ' in ' +
     *            componentName
     *          );
     *        }
     *      }
     *    },
     *    render: function() {...}
     *  });
     *
     * @internal
     */

    var ANONYMOUS = '<<anonymous>>';

    // Important!
    // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
    var ReactPropTypes = {
      array: createPrimitiveTypeChecker('array'),
      bool: createPrimitiveTypeChecker('boolean'),
      func: createPrimitiveTypeChecker('function'),
      number: createPrimitiveTypeChecker('number'),
      object: createPrimitiveTypeChecker('object'),
      string: createPrimitiveTypeChecker('string'),
      symbol: createPrimitiveTypeChecker('symbol'),

      any: createAnyTypeChecker(),
      arrayOf: createArrayOfTypeChecker,
      element: createElementTypeChecker(),
      instanceOf: createInstanceTypeChecker,
      node: createNodeChecker(),
      objectOf: createObjectOfTypeChecker,
      oneOf: createEnumTypeChecker,
      oneOfType: createUnionTypeChecker,
      shape: createShapeTypeChecker,
      exact: createStrictShapeTypeChecker,
    };

    /**
     * inlined Object.is polyfill to avoid requiring consumers ship their own
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
     */
    /*eslint-disable no-self-compare*/
    function is(x, y) {
      // SameValue algorithm
      if (x === y) {
        // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y;
      } else {
        // Step 6.a: NaN == NaN
        return x !== x && y !== y;
      }
    }
    /*eslint-enable no-self-compare*/

    /**
     * We use an Error-like object for backward compatibility as people may call
     * PropTypes directly and inspect their output. However, we don't use real
     * Errors anymore. We don't inspect their stack anyway, and creating them
     * is prohibitively expensive if they are created too often, such as what
     * happens in oneOfType() for any type before the one that matched.
     */
    function PropTypeError(message) {
      this.message = message;
      this.stack = '';
    }
    // Make `instanceof Error` still work for returned errors.
    PropTypeError.prototype = Error.prototype;

    function createChainableTypeChecker(validate) {
      {
        var manualPropTypeCallCache = {};
        var manualPropTypeWarningCount = 0;
      }
      function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
        componentName = componentName || ANONYMOUS;
        propFullName = propFullName || propName;

        if (secret !== ReactPropTypesSecret_1) {
          if (throwOnDirectAccess) {
            // New behavior only for users of `prop-types` package
            var err = new Error(
              'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
              'Use `PropTypes.checkPropTypes()` to call them. ' +
              'Read more at http://fb.me/use-check-prop-types'
            );
            err.name = 'Invariant Violation';
            throw err;
          } else if ( typeof console !== 'undefined') {
            // Old behavior for people using React.PropTypes
            var cacheKey = componentName + ':' + propName;
            if (
              !manualPropTypeCallCache[cacheKey] &&
              // Avoid spamming the console because they are often not actionable except for lib authors
              manualPropTypeWarningCount < 3
            ) {
              printWarning$1(
                'You are manually calling a React.PropTypes validation ' +
                'function for the `' + propFullName + '` prop on `' + componentName  + '`. This is deprecated ' +
                'and will throw in the standalone `prop-types` package. ' +
                'You may be seeing this warning due to a third-party PropTypes ' +
                'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
              );
              manualPropTypeCallCache[cacheKey] = true;
              manualPropTypeWarningCount++;
            }
          }
        }
        if (props[propName] == null) {
          if (isRequired) {
            if (props[propName] === null) {
              return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
            }
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
          }
          return null;
        } else {
          return validate(props, propName, componentName, location, propFullName);
        }
      }

      var chainedCheckType = checkType.bind(null, false);
      chainedCheckType.isRequired = checkType.bind(null, true);

      return chainedCheckType;
    }

    function createPrimitiveTypeChecker(expectedType) {
      function validate(props, propName, componentName, location, propFullName, secret) {
        var propValue = props[propName];
        var propType = getPropType(propValue);
        if (propType !== expectedType) {
          // `propValue` being instance of, say, date/regexp, pass the 'object'
          // check, but we can offer a more precise error message here rather than
          // 'of type `object`'.
          var preciseType = getPreciseType(propValue);

          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createAnyTypeChecker() {
      return createChainableTypeChecker(emptyFunctionThatReturnsNull);
    }

    function createArrayOfTypeChecker(typeChecker) {
      function validate(props, propName, componentName, location, propFullName) {
        if (typeof typeChecker !== 'function') {
          return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
        }
        var propValue = props[propName];
        if (!Array.isArray(propValue)) {
          var propType = getPropType(propValue);
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
        }
        for (var i = 0; i < propValue.length; i++) {
          var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret_1);
          if (error instanceof Error) {
            return error;
          }
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createElementTypeChecker() {
      function validate(props, propName, componentName, location, propFullName) {
        var propValue = props[propName];
        if (!isValidElement(propValue)) {
          var propType = getPropType(propValue);
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createInstanceTypeChecker(expectedClass) {
      function validate(props, propName, componentName, location, propFullName) {
        if (!(props[propName] instanceof expectedClass)) {
          var expectedClassName = expectedClass.name || ANONYMOUS;
          var actualClassName = getClassName(props[propName]);
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createEnumTypeChecker(expectedValues) {
      if (!Array.isArray(expectedValues)) {
         printWarning$1('Invalid argument supplied to oneOf, expected an instance of array.') ;
        return emptyFunctionThatReturnsNull;
      }

      function validate(props, propName, componentName, location, propFullName) {
        var propValue = props[propName];
        for (var i = 0; i < expectedValues.length; i++) {
          if (is(propValue, expectedValues[i])) {
            return null;
          }
        }

        var valuesString = JSON.stringify(expectedValues);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
      }
      return createChainableTypeChecker(validate);
    }

    function createObjectOfTypeChecker(typeChecker) {
      function validate(props, propName, componentName, location, propFullName) {
        if (typeof typeChecker !== 'function') {
          return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
        }
        var propValue = props[propName];
        var propType = getPropType(propValue);
        if (propType !== 'object') {
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
        }
        for (var key in propValue) {
          if (propValue.hasOwnProperty(key)) {
            var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret_1);
            if (error instanceof Error) {
              return error;
            }
          }
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createUnionTypeChecker(arrayOfTypeCheckers) {
      if (!Array.isArray(arrayOfTypeCheckers)) {
         printWarning$1('Invalid argument supplied to oneOfType, expected an instance of array.') ;
        return emptyFunctionThatReturnsNull;
      }

      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        if (typeof checker !== 'function') {
          printWarning$1(
            'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
            'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
          );
          return emptyFunctionThatReturnsNull;
        }
      }

      function validate(props, propName, componentName, location, propFullName) {
        for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
          var checker = arrayOfTypeCheckers[i];
          if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret_1) == null) {
            return null;
          }
        }

        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
      }
      return createChainableTypeChecker(validate);
    }

    function createNodeChecker() {
      function validate(props, propName, componentName, location, propFullName) {
        if (!isNode(props[propName])) {
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createShapeTypeChecker(shapeTypes) {
      function validate(props, propName, componentName, location, propFullName) {
        var propValue = props[propName];
        var propType = getPropType(propValue);
        if (propType !== 'object') {
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
        }
        for (var key in shapeTypes) {
          var checker = shapeTypes[key];
          if (!checker) {
            continue;
          }
          var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret_1);
          if (error) {
            return error;
          }
        }
        return null;
      }
      return createChainableTypeChecker(validate);
    }

    function createStrictShapeTypeChecker(shapeTypes) {
      function validate(props, propName, componentName, location, propFullName) {
        var propValue = props[propName];
        var propType = getPropType(propValue);
        if (propType !== 'object') {
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
        }
        // We need to check all keys in case some are required but missing from
        // props.
        var allKeys = assign({}, props[propName], shapeTypes);
        for (var key in allKeys) {
          var checker = shapeTypes[key];
          if (!checker) {
            return new PropTypeError(
              'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
              '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
              '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
            );
          }
          var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret_1);
          if (error) {
            return error;
          }
        }
        return null;
      }

      return createChainableTypeChecker(validate);
    }

    function isNode(propValue) {
      switch (typeof propValue) {
        case 'number':
        case 'string':
        case 'undefined':
          return true;
        case 'boolean':
          return !propValue;
        case 'object':
          if (Array.isArray(propValue)) {
            return propValue.every(isNode);
          }
          if (propValue === null || isValidElement(propValue)) {
            return true;
          }

          var iteratorFn = getIteratorFn(propValue);
          if (iteratorFn) {
            var iterator = iteratorFn.call(propValue);
            var step;
            if (iteratorFn !== propValue.entries) {
              while (!(step = iterator.next()).done) {
                if (!isNode(step.value)) {
                  return false;
                }
              }
            } else {
              // Iterator will provide entry [k,v] tuples rather than values.
              while (!(step = iterator.next()).done) {
                var entry = step.value;
                if (entry) {
                  if (!isNode(entry[1])) {
                    return false;
                  }
                }
              }
            }
          } else {
            return false;
          }

          return true;
        default:
          return false;
      }
    }

    function isSymbol(propType, propValue) {
      // Native Symbol.
      if (propType === 'symbol') {
        return true;
      }

      // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
      if (propValue['@@toStringTag'] === 'Symbol') {
        return true;
      }

      // Fallback for non-spec compliant Symbols which are polyfilled.
      if (typeof Symbol === 'function' && propValue instanceof Symbol) {
        return true;
      }

      return false;
    }

    // Equivalent of `typeof` but with special handling for array and regexp.
    function getPropType(propValue) {
      var propType = typeof propValue;
      if (Array.isArray(propValue)) {
        return 'array';
      }
      if (propValue instanceof RegExp) {
        // Old webkits (at least until Android 4.0) return 'function' rather than
        // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
        // passes PropTypes.object.
        return 'object';
      }
      if (isSymbol(propType, propValue)) {
        return 'symbol';
      }
      return propType;
    }

    // This handles more types than `getPropType`. Only used for error messages.
    // See `createPrimitiveTypeChecker`.
    function getPreciseType(propValue) {
      if (typeof propValue === 'undefined' || propValue === null) {
        return '' + propValue;
      }
      var propType = getPropType(propValue);
      if (propType === 'object') {
        if (propValue instanceof Date) {
          return 'date';
        } else if (propValue instanceof RegExp) {
          return 'regexp';
        }
      }
      return propType;
    }

    // Returns a string that is postfixed to a warning about an invalid type.
    // For example, "undefined" or "of type array"
    function getPostfixForTypeWarning(value) {
      var type = getPreciseType(value);
      switch (type) {
        case 'array':
        case 'object':
          return 'an ' + type;
        case 'boolean':
        case 'date':
        case 'regexp':
          return 'a ' + type;
        default:
          return type;
      }
    }

    // Returns class name of the object, if any.
    function getClassName(propValue) {
      if (!propValue.constructor || !propValue.constructor.name) {
        return ANONYMOUS;
      }
      return propValue.constructor.name;
    }

    ReactPropTypes.checkPropTypes = checkPropTypes_1;
    ReactPropTypes.PropTypes = ReactPropTypes;

    return ReactPropTypes;
  };

  var propTypes = createCommonjsModule(function (module) {
  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  {
    var REACT_ELEMENT_TYPE = (typeof Symbol === 'function' &&
      Symbol.for &&
      Symbol.for('react.element')) ||
      0xeac7;

    var isValidElement = function(object) {
      return typeof object === 'object' &&
        object !== null &&
        object.$$typeof === REACT_ELEMENT_TYPE;
    };

    // By explicitly using `prop-types` you are opting into new development behavior.
    // http://fb.me/prop-types-in-prod
    var throwOnDirectAccess = true;
    module.exports = factoryWithTypeCheckers(isValidElement, throwOnDirectAccess);
  }
  });

  {
    module.exports = require('./cjs/react-is.development.js');
  }

  var reactIs$1 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var ReactIs = /*@__PURE__*/getAugmentedNamespace(reactIs$1);

  /**
   * Copyright 2015, Yahoo! Inc.
   * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
   */

  var REACT_STATICS$1 = {
      childContextTypes: true,
      contextType: true,
      contextTypes: true,
      defaultProps: true,
      displayName: true,
      getDefaultProps: true,
      getDerivedStateFromError: true,
      getDerivedStateFromProps: true,
      mixins: true,
      propTypes: true,
      type: true
  };

  var KNOWN_STATICS$1 = {
      name: true,
      length: true,
      prototype: true,
      caller: true,
      callee: true,
      arguments: true,
      arity: true
  };

  var FORWARD_REF_STATICS$1 = {
      '$$typeof': true,
      render: true,
      defaultProps: true,
      displayName: true,
      propTypes: true
  };

  var MEMO_STATICS = {
      '$$typeof': true,
      compare: true,
      defaultProps: true,
      displayName: true,
      propTypes: true,
      type: true
  };

  var TYPE_STATICS$1 = {};
  TYPE_STATICS$1[ReactIs.ForwardRef] = FORWARD_REF_STATICS$1;

  function getStatics(component) {
      if (ReactIs.isMemo(component)) {
          return MEMO_STATICS;
      }
      return TYPE_STATICS$1[component['$$typeof']] || REACT_STATICS$1;
  }

  var defineProperty$1 = Object.defineProperty;
  var getOwnPropertyNames$1 = Object.getOwnPropertyNames;
  var getOwnPropertySymbols$2 = Object.getOwnPropertySymbols;
  var getOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;
  var getPrototypeOf$1 = Object.getPrototypeOf;
  var objectPrototype$1 = Object.prototype;

  function hoistNonReactStatics$1(targetComponent, sourceComponent, blacklist) {
      if (typeof sourceComponent !== 'string') {
          // don't hoist over string (html) components

          if (objectPrototype$1) {
              var inheritedComponent = getPrototypeOf$1(sourceComponent);
              if (inheritedComponent && inheritedComponent !== objectPrototype$1) {
                  hoistNonReactStatics$1(targetComponent, inheritedComponent, blacklist);
              }
          }

          var keys = getOwnPropertyNames$1(sourceComponent);

          if (getOwnPropertySymbols$2) {
              keys = keys.concat(getOwnPropertySymbols$2(sourceComponent));
          }

          var targetStatics = getStatics(targetComponent);
          var sourceStatics = getStatics(sourceComponent);

          for (var i = 0; i < keys.length; ++i) {
              var key = keys[i];
              if (!KNOWN_STATICS$1[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
                  var descriptor = getOwnPropertyDescriptor$1(sourceComponent, key);
                  try {
                      // Avoid failures from read-only properties
                      defineProperty$1(targetComponent, key, descriptor);
                  } catch (e) {}
              }
          }

          return targetComponent;
      }

      return targetComponent;
  }

  var hoistNonReactStatics_cjs$1 = hoistNonReactStatics$1;

  var getDisplayName_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getDisplayName;
  function getDisplayName(Component) {
    return Component.displayName || Component.name || (typeof Component === 'string' && Component.length > 0 ? Component : 'Unknown');
  }
  });

  var getDisplayName = /*@__PURE__*/getDefaultExportFromCjs(getDisplayName_1);

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _extends$1() {
    _extends$1 = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends$1.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function isObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  function createThemeProvider(context) {
    var ThemeProvider =
    /*#__PURE__*/
    function (_React$Component) {
      _inheritsLoose(ThemeProvider, _React$Component);

      function ThemeProvider() {
        var _this;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        _this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "cachedTheme", void 0);

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "lastOuterTheme", void 0);

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "lastTheme", void 0);

        _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "renderProvider", function (outerTheme) {
          var children = _this.props.children;
          return React__default['default'].createElement(context.Provider, {
            value: _this.getTheme(outerTheme)
          }, children);
        });

        return _this;
      }

      var _proto = ThemeProvider.prototype;

      // Get the theme from the props, supporting both (outerTheme) => {} as well as object notation
      _proto.getTheme = function getTheme(outerTheme) {
        if (this.props.theme !== this.lastTheme || outerTheme !== this.lastOuterTheme || !this.cachedTheme) {
          this.lastOuterTheme = outerTheme;
          this.lastTheme = this.props.theme;

          if (typeof this.lastTheme === 'function') {
            var theme = this.props.theme;
            this.cachedTheme = theme(outerTheme);
             warning(isObject(this.cachedTheme), '[ThemeProvider] Please return an object from your theme function') ;
          } else {
            var _theme = this.props.theme;
             warning(isObject(_theme), '[ThemeProvider] Please make your theme prop a plain object') ;
            this.cachedTheme = outerTheme ? _extends$1({}, outerTheme, _theme) : _theme;
          }
        }

        return this.cachedTheme;
      };

      _proto.render = function render() {
        var children = this.props.children;

        if (!children) {
          return null;
        }

        return React__default['default'].createElement(context.Consumer, null, this.renderProvider);
      };

      return ThemeProvider;
    }(React__default['default'].Component);

    {
      ThemeProvider.propTypes = {
        // eslint-disable-next-line react/require-default-props
        children: propTypes.node,
        theme: propTypes.oneOfType([propTypes.shape({}), propTypes.func]).isRequired
      };
    }

    return ThemeProvider;
  }

  function createWithTheme(context) {
    return function hoc(Component) {
      var withTheme = React__default['default'].forwardRef(function (props, ref) {
        return React__default['default'].createElement(context.Consumer, null, function (theme) {
           warning(isObject(theme), '[theming] Please use withTheme only with the ThemeProvider') ;
          return React__default['default'].createElement(Component, _extends$1({
            theme: theme,
            ref: ref
          }, props));
        });
      });

      {
        withTheme.displayName = "WithTheme(" + getDisplayName(Component) + ")";
      }

      hoistNonReactStatics_cjs$1(withTheme, Component);
      return withTheme;
    };
  }

  function createUseTheme(context) {
    var useTheme = function useTheme() {
      var theme = React__default['default'].useContext(context);
       warning(isObject(theme), '[theming] Please use useTheme only with the ThemeProvider') ;
      return theme;
    };

    return useTheme;
  }

  function createTheming(context) {
    return {
      context: context,
      withTheme: createWithTheme(context),
      useTheme: createUseTheme(context),
      ThemeProvider: createThemeProvider(context)
    };
  }

  var ThemeContext = React.createContext();

  var _createTheming = createTheming(ThemeContext),
      withTheme = _createTheming.withTheme,
      ThemeProvider = _createTheming.ThemeProvider,
      useTheme = _createTheming.useTheme;

  var getDisplayName$1 = function getDisplayName(Component) {
    return Component.displayName || Component.name || 'Component';
  };

  var memoize = function memoize(fn) {
    var lastArgs;
    var lastResult;
    return function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (Array.isArray(lastArgs) && args.length === lastArgs.length) {
        var isSame = true;

        for (var i = 0; i < args.length; i++) {
          if (args[i] !== lastArgs[i]) {
            isSame = false;
          }
        }

        if (isSame) {
          return lastResult;
        }
      }

      lastArgs = args;
      lastResult = fn.apply(void 0, args);
      return lastResult;
    };
  };

  var mergeClasses = function mergeClasses(baseClasses, additionalClasses) {
    var combinedClasses = _extends({}, baseClasses);

    for (var name in additionalClasses) {
      combinedClasses[name] = name in combinedClasses ? combinedClasses[name] + " " + additionalClasses[name] : additionalClasses[name];
    }

    return combinedClasses;
  };

  /**
   * Global index counter to preserve source order.
   * As we create the style sheet during componentWillMount lifecycle,
   * children are handled after the parents, so the order of style elements would
   * be parent->child. It is a problem though when a parent passes a className
   * which needs to override any childs styles. StyleSheet of the child has a higher
   * specificity, because of the source order.
   * So our solution is to render sheets them in the reverse order child->sheet, so
   * that parent has a higher specificity.
   *
   * We start at [Number.MIN_SAFE_INTEGER] to always insert sheets from react-jss first before any
   * sheet which might be inserted manually by the user.
   */
  var index = Number.MIN_SAFE_INTEGER || -1e9;

  var getSheetIndex = function getSheetIndex() {
    return index++;
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var isBrowser = (typeof window === "undefined" ? "undefined" : _typeof(window)) === "object" && (typeof document === "undefined" ? "undefined" : _typeof(document)) === 'object' && document.nodeType === 9;

  var JssContext = React.createContext({
    classNamePrefix: '',
    disableStylesGeneration: false,
    isSSR: !isBrowser
  });

  var defaultManagers = new Map();
  var getManager = function getManager(context, managerId) {
    // If `managers` map is present in the context, we use it in order to
    // let JssProvider reset them when new response has to render server-side.
    var managers = context.managers;

    if (managers) {
      if (!managers[managerId]) {
        managers[managerId] = new jss.SheetsManager();
      }

      return managers[managerId];
    }

    var manager = defaultManagers.get(managerId);

    if (!manager) {
      manager = new jss.SheetsManager();
      defaultManagers.set(managerId, manager);
    }

    return manager;
  };
  var manageSheet = function manageSheet(options) {
    var sheet = options.sheet,
        context = options.context,
        index = options.index,
        theme = options.theme;

    if (!sheet) {
      return;
    }

    var manager = getManager(context, index);
    manager.manage(theme);

    if (context.registry) {
      context.registry.add(sheet);
    }
  };
  var unmanageSheet = function unmanageSheet(options) {
    if (!options.sheet) {
      return;
    }

    var manager = getManager(options.context, options.index);
    manager.unmanage(options.theme);
  };

  var now = Date.now();
  var fnValuesNs = "fnValues" + now;
  var fnRuleNs = "fnStyle" + ++now;

  var functionPlugin = function functionPlugin() {
    return {
      onCreateRule: function onCreateRule(name, decl, options) {
        if (typeof decl !== 'function') return null;
        var rule = jss.createRule(name, {}, options);
        rule[fnRuleNs] = decl;
        return rule;
      },
      onProcessStyle: function onProcessStyle(style, rule) {
        // We need to extract function values from the declaration, so that we can keep core unaware of them.
        // We need to do that only once.
        // We don't need to extract functions on each style update, since this can happen only once.
        // We don't support function values inside of function rules.
        if (fnValuesNs in rule || fnRuleNs in rule) return style;
        var fnValues = {};

        for (var prop in style) {
          var value = style[prop];
          if (typeof value !== 'function') continue;
          delete style[prop];
          fnValues[prop] = value;
        }

        rule[fnValuesNs] = fnValues;
        return style;
      },
      onUpdate: function onUpdate(data, rule, sheet, options) {
        var styleRule = rule;
        var fnRule = styleRule[fnRuleNs]; // If we have a style function, the entire rule is dynamic and style object
        // will be returned from that function.

        if (fnRule) {
          // Empty object will remove all currently defined props
          // in case function rule returns a falsy value.
          styleRule.style = fnRule(data) || {};

          {
            for (var prop in styleRule.style) {
              if (typeof styleRule.style[prop] === 'function') {
                  warning(false, '[JSS] Function values inside function rules are not supported.')  ;
                break;
              }
            }
          }
        }

        var fnValues = styleRule[fnValuesNs]; // If we have a fn values map, it is a rule with function values.

        if (fnValues) {
          for (var _prop in fnValues) {
            styleRule.prop(_prop, fnValues[_prop](data), options);
          }
        }
      }
    };
  };

  function symbolObservablePonyfill(root) {
  	var result;
  	var Symbol = root.Symbol;

  	if (typeof Symbol === 'function') {
  		if (Symbol.observable) {
  			result = Symbol.observable;
  		} else {
  			result = Symbol('observable');
  			Symbol.observable = result;
  		}
  	} else {
  		result = '@@observable';
  	}

  	return result;
  }

  /* global window */

  var root;

  if (typeof self !== 'undefined') {
    root = self;
  } else if (typeof window !== 'undefined') {
    root = window;
  } else if (typeof global !== 'undefined') {
    root = global;
  } else if (typeof module !== 'undefined') {
    root = module;
  } else {
    root = Function('return this')();
  }

  var result = symbolObservablePonyfill(root);

  var isObservable = function isObservable(value) {
    return value && value[result] && value === value[result]();
  };

  var observablePlugin = function observablePlugin(updateOptions) {
    return {
      onCreateRule: function onCreateRule(name, decl, options) {
        if (!isObservable(decl)) return null;
        var style$ = decl;
        var rule = jss.createRule(name, {}, options); // TODO
        // Call `stream.subscribe()` returns a subscription, which should be explicitly
        // unsubscribed from when we know this sheet is no longer needed.

        style$.subscribe(function (style) {
          for (var prop in style) {
            rule.prop(prop, style[prop], updateOptions);
          }
        });
        return rule;
      },
      onProcessRule: function onProcessRule(rule) {
        if (rule && rule.type !== 'style') return;
        var styleRule = rule;
        var style = styleRule.style;

        var _loop = function _loop(prop) {
          var value = style[prop];
          if (!isObservable(value)) return "continue";
          delete style[prop];
          value.subscribe({
            next: function next(nextValue) {
              styleRule.prop(prop, nextValue, updateOptions);
            }
          });
        };

        for (var prop in style) {
          var _ret = _loop(prop);

          if (_ret === "continue") continue;
        }
      }
    };
  };

  var semiWithNl = /;\n/;
  /**
   * Naive CSS parser.
   * - Supports only rule body (no selectors)
   * - Requires semicolon and new line after the value (except of last line)
   * - No nested rules support
   */

  var parse = function parse(cssText) {
    var style = {};
    var split = cssText.split(semiWithNl);

    for (var i = 0; i < split.length; i++) {
      var decl = (split[i] || '').trim();
      if (!decl) continue;
      var colonIndex = decl.indexOf(':');

      if (colonIndex === -1) {
          warning(false, "[JSS] Malformed CSS string \"" + decl + "\"")  ;
        continue;
      }

      var prop = decl.substr(0, colonIndex).trim();
      var value = decl.substr(colonIndex + 1).trim();
      style[prop] = value;
    }

    return style;
  };

  var onProcessRule = function onProcessRule(rule) {
    if (typeof rule.style === 'string') {
      rule.style = parse(rule.style);
    }
  };

  function templatePlugin() {
    return {
      onProcessRule: onProcessRule
    };
  }

  var at = '@global';
  var atPrefix = '@global ';

  var GlobalContainerRule =
  /*#__PURE__*/
  function () {
    function GlobalContainerRule(key, styles, options) {
      this.type = 'global';
      this.at = at;
      this.isProcessed = false;
      this.key = key;
      this.options = options;
      this.rules = new jss.RuleList(_extends({}, options, {
        parent: this
      }));

      for (var selector in styles) {
        this.rules.add(selector, styles[selector]);
      }

      this.rules.process();
    }
    /**
     * Get a rule.
     */


    var _proto = GlobalContainerRule.prototype;

    _proto.getRule = function getRule(name) {
      return this.rules.get(name);
    }
    /**
     * Create and register rule, run plugins.
     */
    ;

    _proto.addRule = function addRule(name, style, options) {
      var rule = this.rules.add(name, style, options);
      if (rule) this.options.jss.plugins.onProcessRule(rule);
      return rule;
    }
    /**
     * Replace rule, run plugins.
     */
    ;

    _proto.replaceRule = function replaceRule(name, style, options) {
      var newRule = this.rules.replace(name, style, options);
      if (newRule) this.options.jss.plugins.onProcessRule(newRule);
      return newRule;
    }
    /**
     * Get index of a rule.
     */
    ;

    _proto.indexOf = function indexOf(rule) {
      return this.rules.indexOf(rule);
    }
    /**
     * Generates a CSS string.
     */
    ;

    _proto.toString = function toString(options) {
      return this.rules.toString(options);
    };

    return GlobalContainerRule;
  }();

  var GlobalPrefixedRule =
  /*#__PURE__*/
  function () {
    function GlobalPrefixedRule(key, style, options) {
      this.type = 'global';
      this.at = at;
      this.isProcessed = false;
      this.key = key;
      this.options = options;
      var selector = key.substr(atPrefix.length);
      this.rule = options.jss.createRule(selector, style, _extends({}, options, {
        parent: this
      }));
    }

    var _proto2 = GlobalPrefixedRule.prototype;

    _proto2.toString = function toString(options) {
      return this.rule ? this.rule.toString(options) : '';
    };

    return GlobalPrefixedRule;
  }();

  var separatorRegExp = /\s*,\s*/g;

  function addScope(selector, scope) {
    var parts = selector.split(separatorRegExp);
    var scoped = '';

    for (var i = 0; i < parts.length; i++) {
      scoped += scope + " " + parts[i].trim();
      if (parts[i + 1]) scoped += ', ';
    }

    return scoped;
  }

  function handleNestedGlobalContainerRule(rule, sheet) {
    var options = rule.options,
        style = rule.style;
    var rules = style ? style[at] : null;
    if (!rules) return;

    for (var name in rules) {
      sheet.addRule(name, rules[name], _extends({}, options, {
        selector: addScope(name, rule.selector)
      }));
    }

    delete style[at];
  }

  function handlePrefixedGlobalRule(rule, sheet) {
    var options = rule.options,
        style = rule.style;

    for (var prop in style) {
      if (prop[0] !== '@' || prop.substr(0, at.length) !== at) continue;
      var selector = addScope(prop.substr(at.length), rule.selector);
      sheet.addRule(selector, style[prop], _extends({}, options, {
        selector: selector
      }));
      delete style[prop];
    }
  }
  /**
   * Convert nested rules to separate, remove them from original styles.
   */


  function jssGlobal() {
    function onCreateRule(name, styles, options) {
      if (!name) return null;

      if (name === at) {
        return new GlobalContainerRule(name, styles, options);
      }

      if (name[0] === '@' && name.substr(0, atPrefix.length) === atPrefix) {
        return new GlobalPrefixedRule(name, styles, options);
      }

      var parent = options.parent;

      if (parent) {
        if (parent.type === 'global' || parent.options.parent && parent.options.parent.type === 'global') {
          options.scoped = false;
        }
      }

      if (!options.selector && options.scoped === false) {
        options.selector = name;
      }

      return null;
    }

    function onProcessRule(rule, sheet) {
      if (rule.type !== 'style' || !sheet) return;
      handleNestedGlobalContainerRule(rule, sheet);
      handlePrefixedGlobalRule(rule, sheet);
    }

    return {
      onCreateRule: onCreateRule,
      onProcessRule: onProcessRule
    };
  }

  var isObject$1 = function isObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  };

  var valueNs = "extendCurrValue" + Date.now();

  function mergeExtend(style, rule, sheet, newStyle) {
    var extendType = typeof style.extend; // Extend using a rule name.

    if (extendType === 'string') {
      if (!sheet) return;
      var refRule = sheet.getRule(style.extend);
      if (!refRule) return;

      if (refRule === rule) {
          warning(false, "[JSS] A rule tries to extend itself \n" + rule.toString())  ;
        return;
      }

      var parent = refRule.options.parent;

      if (parent) {
        var originalStyle = parent.rules.raw[style.extend];
        extend(originalStyle, rule, sheet, newStyle);
      }

      return;
    } // Extend using an array.


    if (Array.isArray(style.extend)) {
      for (var index = 0; index < style.extend.length; index++) {
        var singleExtend = style.extend[index];
        var singleStyle = typeof singleExtend === 'string' ? _extends({}, style, {
          extend: singleExtend
        }) : style.extend[index];
        extend(singleStyle, rule, sheet, newStyle);
      }

      return;
    } // Extend is a style object.


    for (var prop in style.extend) {
      if (prop === 'extend') {
        extend(style.extend.extend, rule, sheet, newStyle);
        continue;
      }

      if (isObject$1(style.extend[prop])) {
        if (!(prop in newStyle)) newStyle[prop] = {};
        extend(style.extend[prop], rule, sheet, newStyle[prop]);
        continue;
      }

      newStyle[prop] = style.extend[prop];
    }
  }

  function mergeRest(style, rule, sheet, newStyle) {
    // Copy base style.
    for (var prop in style) {
      if (prop === 'extend') continue;

      if (isObject$1(newStyle[prop]) && isObject$1(style[prop])) {
        extend(style[prop], rule, sheet, newStyle[prop]);
        continue;
      }

      if (isObject$1(style[prop])) {
        newStyle[prop] = extend(style[prop], rule, sheet);
        continue;
      }

      newStyle[prop] = style[prop];
    }
  }
  /**
   * Recursively extend styles.
   */


  function extend(style, rule, sheet, newStyle) {
    if (newStyle === void 0) {
      newStyle = {};
    }

    mergeExtend(style, rule, sheet, newStyle);
    mergeRest(style, rule, sheet, newStyle);
    return newStyle;
  }
  /**
   * Handle `extend` property.
   */


  function jssExtend() {
    function onProcessStyle(style, rule, sheet) {
      if ('extend' in style) return extend(style, rule, sheet);
      return style;
    }

    function onChangeValue(value, prop, rule) {
      if (prop !== 'extend') return value; // Value is empty, remove properties set previously.

      if (value == null || value === false) {
        for (var key in rule[valueNs]) {
          rule.prop(key, null);
        }

        rule[valueNs] = null;
        return null;
      }

      if (typeof value === 'object') {
        for (var _key in value) {
          rule.prop(_key, value[_key]);
        }

        rule[valueNs] = value;
      } // Make sure we don't set the value in the core.


      return null;
    }

    return {
      onProcessStyle: onProcessStyle,
      onChangeValue: onChangeValue
    };
  }

  var separatorRegExp$1 = /\s*,\s*/g;
  var parentRegExp = /&/g;
  var refRegExp = /\$([\w-]+)/g;
  /**
   * Convert nested rules to separate, remove them from original styles.
   */

  function jssNested() {
    // Get a function to be used for $ref replacement.
    function getReplaceRef(container, sheet) {
      return function (match, key) {
        var rule = container.getRule(key) || sheet && sheet.getRule(key);

        if (rule) {
          return rule.selector;
        }

          warning(false, "[JSS] Could not find the referenced rule \"" + key + "\" in \"" + (container.options.meta || container.toString()) + "\".")  ;
        return key;
      };
    }

    function replaceParentRefs(nestedProp, parentProp) {
      var parentSelectors = parentProp.split(separatorRegExp$1);
      var nestedSelectors = nestedProp.split(separatorRegExp$1);
      var result = '';

      for (var i = 0; i < parentSelectors.length; i++) {
        var parent = parentSelectors[i];

        for (var j = 0; j < nestedSelectors.length; j++) {
          var nested = nestedSelectors[j];
          if (result) result += ', '; // Replace all & by the parent or prefix & with the parent.

          result += nested.indexOf('&') !== -1 ? nested.replace(parentRegExp, parent) : parent + " " + nested;
        }
      }

      return result;
    }

    function getOptions(rule, container, prevOptions) {
      // Options has been already created, now we only increase index.
      if (prevOptions) return _extends({}, prevOptions, {
        index: prevOptions.index + 1
      });
      var nestingLevel = rule.options.nestingLevel;
      nestingLevel = nestingLevel === undefined ? 1 : nestingLevel + 1;

      var options = _extends({}, rule.options, {
        nestingLevel: nestingLevel,
        index: container.indexOf(rule) + 1 // We don't need the parent name to be set options for chlid.

      });

      delete options.name;
      return options;
    }

    function onProcessStyle(style, rule, sheet) {
      if (rule.type !== 'style') return style;
      var styleRule = rule;
      var container = styleRule.options.parent;
      var options;
      var replaceRef;

      for (var prop in style) {
        var isNested = prop.indexOf('&') !== -1;
        var isNestedConditional = prop[0] === '@';
        if (!isNested && !isNestedConditional) continue;
        options = getOptions(styleRule, container, options);

        if (isNested) {
          var selector = replaceParentRefs(prop, styleRule.selector); // Lazily create the ref replacer function just once for
          // all nested rules within the sheet.

          if (!replaceRef) replaceRef = getReplaceRef(container, sheet); // Replace all $refs.

          selector = selector.replace(refRegExp, replaceRef);
          var name = styleRule.key + "-" + prop;

          if ('replaceRule' in container) {
            // for backward compatibility
            container.replaceRule(name, style[prop], _extends({}, options, {
              selector: selector
            }));
          } else {
            container.addRule(name, style[prop], _extends({}, options, {
              selector: selector
            }));
          }
        } else if (isNestedConditional) {
          // Place conditional right after the parent rule to ensure right ordering.
          container.addRule(prop, {}, options).addRule(styleRule.key, style[prop], {
            selector: styleRule.selector
          });
        }

        delete style[prop];
      }

      return style;
    }

    return {
      onProcessStyle: onProcessStyle
    };
  }

  /**
   * Set selector.
   *
   * @param original rule
   * @param className class string
   * @return flag indicating function was successfull or not
   */

  function registerClass(rule, className) {
    // Skip falsy values
    if (!className) return true; // Support array of class names `{composes: ['foo', 'bar']}`

    if (Array.isArray(className)) {
      for (var index = 0; index < className.length; index++) {
        var isSetted = registerClass(rule, className[index]);
        if (!isSetted) return false;
      }

      return true;
    } // Support space separated class names `{composes: 'foo bar'}`


    if (className.indexOf(' ') > -1) {
      return registerClass(rule, className.split(' '));
    }

    var parent = rule.options.parent; // It is a ref to a local rule.

    if (className[0] === '$') {
      var refRule = parent.getRule(className.substr(1));

      if (!refRule) {
          warning(false, "[JSS] Referenced rule is not defined. \n" + rule.toString())  ;
        return false;
      }

      if (refRule === rule) {
          warning(false, "[JSS] Cyclic composition detected. \n" + rule.toString())  ;
        return false;
      }

      parent.classes[rule.key] += " " + parent.classes[refRule.key];
      return true;
    }

    parent.classes[rule.key] += " " + className;
    return true;
  }
  /**
   * Convert compose property to additional class, remove property from original styles.
   */


  function jssCompose() {
    function onProcessStyle(style, rule) {
      if (!('composes' in style)) return style;
      registerClass(rule, style.composes); // Remove composes property to prevent infinite loop.

      delete style.composes;
      return style;
    }

    return {
      onProcessStyle: onProcessStyle
    };
  }

  /* eslint-disable no-var, prefer-template */
  var uppercasePattern = /[A-Z]/g;
  var msPattern = /^ms-/;
  var cache = {};

  function toHyphenLower(match) {
    return '-' + match.toLowerCase()
  }

  function hyphenateStyleName(name) {
    if (cache.hasOwnProperty(name)) {
      return cache[name]
    }

    var hName = name.replace(uppercasePattern, toHyphenLower);
    return (cache[name] = msPattern.test(hName) ? '-' + hName : hName)
  }

  /**
   * Convert camel cased property names to dash separated.
   */

  function convertCase(style) {
    var converted = {};

    for (var prop in style) {
      var key = prop.indexOf('--') === 0 ? prop : hyphenateStyleName(prop);
      converted[key] = style[prop];
    }

    if (style.fallbacks) {
      if (Array.isArray(style.fallbacks)) converted.fallbacks = style.fallbacks.map(convertCase);else converted.fallbacks = convertCase(style.fallbacks);
    }

    return converted;
  }
  /**
   * Allow camel cased property names by converting them back to dasherized.
   */


  function camelCase() {
    function onProcessStyle(style) {
      if (Array.isArray(style)) {
        // Handle rules like @font-face, which can have multiple styles in an array
        for (var index = 0; index < style.length; index++) {
          style[index] = convertCase(style[index]);
        }

        return style;
      }

      return convertCase(style);
    }

    function onChangeValue(value, prop, rule) {
      if (prop.indexOf('--') === 0) {
        return value;
      }

      var hyphenatedProp = hyphenateStyleName(prop); // There was no camel case in place

      if (prop === hyphenatedProp) return value;
      rule.prop(hyphenatedProp, value); // Core will ignore that property value we set the proper one above.

      return null;
    }

    return {
      onProcessStyle: onProcessStyle,
      onChangeValue: onChangeValue
    };
  }

  var px = jss.hasCSSTOMSupport && CSS ? CSS.px : 'px';
  var ms = jss.hasCSSTOMSupport && CSS ? CSS.ms : 'ms';
  var percent = jss.hasCSSTOMSupport && CSS ? CSS.percent : '%';
  /**
   * Generated jss-plugin-default-unit CSS property units
   */

  var defaultUnits = {
    // Animation properties
    'animation-delay': ms,
    'animation-duration': ms,
    // Background properties
    'background-position': px,
    'background-position-x': px,
    'background-position-y': px,
    'background-size': px,
    // Border Properties
    border: px,
    'border-bottom': px,
    'border-bottom-left-radius': px,
    'border-bottom-right-radius': px,
    'border-bottom-width': px,
    'border-left': px,
    'border-left-width': px,
    'border-radius': px,
    'border-right': px,
    'border-right-width': px,
    'border-top': px,
    'border-top-left-radius': px,
    'border-top-right-radius': px,
    'border-top-width': px,
    'border-width': px,
    'border-block': px,
    'border-block-end': px,
    'border-block-end-width': px,
    'border-block-start': px,
    'border-block-start-width': px,
    'border-block-width': px,
    'border-inline': px,
    'border-inline-end': px,
    'border-inline-end-width': px,
    'border-inline-start': px,
    'border-inline-start-width': px,
    'border-inline-width': px,
    'border-start-start-radius': px,
    'border-start-end-radius': px,
    'border-end-start-radius': px,
    'border-end-end-radius': px,
    // Margin properties
    margin: px,
    'margin-bottom': px,
    'margin-left': px,
    'margin-right': px,
    'margin-top': px,
    'margin-block': px,
    'margin-block-end': px,
    'margin-block-start': px,
    'margin-inline': px,
    'margin-inline-end': px,
    'margin-inline-start': px,
    // Padding properties
    padding: px,
    'padding-bottom': px,
    'padding-left': px,
    'padding-right': px,
    'padding-top': px,
    'padding-block': px,
    'padding-block-end': px,
    'padding-block-start': px,
    'padding-inline': px,
    'padding-inline-end': px,
    'padding-inline-start': px,
    // Mask properties
    'mask-position-x': px,
    'mask-position-y': px,
    'mask-size': px,
    // Width and height properties
    height: px,
    width: px,
    'min-height': px,
    'max-height': px,
    'min-width': px,
    'max-width': px,
    // Position properties
    bottom: px,
    left: px,
    top: px,
    right: px,
    inset: px,
    'inset-block': px,
    'inset-block-end': px,
    'inset-block-start': px,
    'inset-inline': px,
    'inset-inline-end': px,
    'inset-inline-start': px,
    // Shadow properties
    'box-shadow': px,
    'text-shadow': px,
    // Column properties
    'column-gap': px,
    'column-rule': px,
    'column-rule-width': px,
    'column-width': px,
    // Font and text properties
    'font-size': px,
    'font-size-delta': px,
    'letter-spacing': px,
    'text-decoration-thickness': px,
    'text-indent': px,
    'text-stroke': px,
    'text-stroke-width': px,
    'word-spacing': px,
    // Motion properties
    motion: px,
    'motion-offset': px,
    // Outline properties
    outline: px,
    'outline-offset': px,
    'outline-width': px,
    // Perspective properties
    perspective: px,
    'perspective-origin-x': percent,
    'perspective-origin-y': percent,
    // Transform properties
    'transform-origin': percent,
    'transform-origin-x': percent,
    'transform-origin-y': percent,
    'transform-origin-z': percent,
    // Transition properties
    'transition-delay': ms,
    'transition-duration': ms,
    // Alignment properties
    'vertical-align': px,
    'flex-basis': px,
    // Some random properties
    'shape-margin': px,
    size: px,
    gap: px,
    // Grid properties
    grid: px,
    'grid-gap': px,
    'row-gap': px,
    'grid-row-gap': px,
    'grid-column-gap': px,
    'grid-template-rows': px,
    'grid-template-columns': px,
    'grid-auto-rows': px,
    'grid-auto-columns': px,
    // Not existing properties.
    // Used to avoid issues with jss-plugin-expand integration.
    'box-shadow-x': px,
    'box-shadow-y': px,
    'box-shadow-blur': px,
    'box-shadow-spread': px,
    'font-line-height': px,
    'text-shadow-x': px,
    'text-shadow-y': px,
    'text-shadow-blur': px
  };
  /**
   * Clones the object and adds a camel cased property version.
   */

  function addCamelCasedVersion(obj) {
    var regExp = /(-[a-z])/g;

    var replace = function replace(str) {
      return str[1].toUpperCase();
    };

    var newObj = {};

    for (var key in obj) {
      newObj[key] = obj[key];
      newObj[key.replace(regExp, replace)] = obj[key];
    }

    return newObj;
  }

  var units = addCamelCasedVersion(defaultUnits);
  /**
   * Recursive deep style passing function
   */

  function iterate(prop, value, options) {
    if (value == null) return value;

    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        value[i] = iterate(prop, value[i], options);
      }
    } else if (typeof value === 'object') {
      if (prop === 'fallbacks') {
        for (var innerProp in value) {
          value[innerProp] = iterate(innerProp, value[innerProp], options);
        }
      } else {
        for (var _innerProp in value) {
          value[_innerProp] = iterate(prop + "-" + _innerProp, value[_innerProp], options);
        }
      } // eslint-disable-next-line no-restricted-globals

    } else if (typeof value === 'number' && isNaN(value) === false) {
      var unit = options[prop] || units[prop]; // Add the unit if available, except for the special case of 0px.

      if (unit && !(value === 0 && unit === px)) {
        return typeof unit === 'function' ? unit(value).toString() : "" + value + unit;
      }

      return value.toString();
    }

    return value;
  }
  /**
   * Add unit to numeric values.
   */


  function defaultUnit(options) {
    if (options === void 0) {
      options = {};
    }

    var camelCasedOptions = addCamelCasedVersion(options);

    function onProcessStyle(style, rule) {
      if (rule.type !== 'style') return style;

      for (var prop in style) {
        style[prop] = iterate(prop, style[prop], camelCasedOptions);
      }

      return style;
    }

    function onChangeValue(value, prop) {
      return iterate(prop, value, camelCasedOptions);
    }

    return {
      onProcessStyle: onProcessStyle,
      onChangeValue: onChangeValue
    };
  }

  /**
   * A scheme for converting properties from array to regular style.
   * All properties listed below will be transformed to a string separated by space.
   */
  var propArray = {
    'background-size': true,
    'background-position': true,
    border: true,
    'border-bottom': true,
    'border-left': true,
    'border-top': true,
    'border-right': true,
    'border-radius': true,
    'border-image': true,
    'border-width': true,
    'border-style': true,
    'border-color': true,
    'box-shadow': true,
    flex: true,
    margin: true,
    padding: true,
    outline: true,
    'transform-origin': true,
    transform: true,
    transition: true
    /**
     * A scheme for converting arrays to regular styles inside of objects.
     * For e.g.: "{position: [0, 0]}" => "background-position: 0 0;".
     */

  };
  var propArrayInObj = {
    position: true,
    // background-position
    size: true // background-size

    /**
     * A scheme for parsing and building correct styles from passed objects.
     */

  };
  var propObj = {
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    background: {
      attachment: null,
      color: null,
      image: null,
      position: null,
      repeat: null
    },
    border: {
      width: null,
      style: null,
      color: null
    },
    'border-top': {
      width: null,
      style: null,
      color: null
    },
    'border-right': {
      width: null,
      style: null,
      color: null
    },
    'border-bottom': {
      width: null,
      style: null,
      color: null
    },
    'border-left': {
      width: null,
      style: null,
      color: null
    },
    outline: {
      width: null,
      style: null,
      color: null
    },
    'list-style': {
      type: null,
      position: null,
      image: null
    },
    transition: {
      property: null,
      duration: null,
      'timing-function': null,
      timingFunction: null,
      // Needed for avoiding comilation issues with jss-plugin-camel-case
      delay: null
    },
    animation: {
      name: null,
      duration: null,
      'timing-function': null,
      timingFunction: null,
      // Needed to avoid compilation issues with jss-plugin-camel-case
      delay: null,
      'iteration-count': null,
      iterationCount: null,
      // Needed to avoid compilation issues with jss-plugin-camel-case
      direction: null,
      'fill-mode': null,
      fillMode: null,
      // Needed to avoid compilation issues with jss-plugin-camel-case
      'play-state': null,
      playState: null // Needed to avoid compilation issues with jss-plugin-camel-case

    },
    'box-shadow': {
      x: 0,
      y: 0,
      blur: 0,
      spread: 0,
      color: null,
      inset: null
    },
    'text-shadow': {
      x: 0,
      y: 0,
      blur: null,
      color: null
      /**
       * A scheme for converting non-standart properties inside object.
       * For e.g.: include 'border-radius' property inside 'border' object.
       */

    }
  };
  var customPropObj = {
    border: {
      radius: 'border-radius',
      image: 'border-image',
      width: 'border-width',
      style: 'border-style',
      color: 'border-color'
    },
    'border-bottom': {
      width: 'border-bottom-width',
      style: 'border-bottom-style',
      color: 'border-bottom-color'
    },
    'border-top': {
      width: 'border-top-width',
      style: 'border-top-style',
      color: 'border-top-color'
    },
    'border-left': {
      width: 'border-left-width',
      style: 'border-left-style',
      color: 'border-left-color'
    },
    'border-right': {
      width: 'border-right-width',
      style: 'border-right-style',
      color: 'border-right-color'
    },
    background: {
      size: 'background-size',
      image: 'background-image'
    },
    font: {
      style: 'font-style',
      variant: 'font-variant',
      weight: 'font-weight',
      stretch: 'font-stretch',
      size: 'font-size',
      family: 'font-family',
      lineHeight: 'line-height',
      // Needed to avoid compilation issues with jss-plugin-camel-case
      'line-height': 'line-height'
    },
    flex: {
      grow: 'flex-grow',
      basis: 'flex-basis',
      direction: 'flex-direction',
      wrap: 'flex-wrap',
      flow: 'flex-flow',
      shrink: 'flex-shrink'
    },
    align: {
      self: 'align-self',
      items: 'align-items',
      content: 'align-content'
    },
    grid: {
      'template-columns': 'grid-template-columns',
      templateColumns: 'grid-template-columns',
      'template-rows': 'grid-template-rows',
      templateRows: 'grid-template-rows',
      'template-areas': 'grid-template-areas',
      templateAreas: 'grid-template-areas',
      template: 'grid-template',
      'auto-columns': 'grid-auto-columns',
      autoColumns: 'grid-auto-columns',
      'auto-rows': 'grid-auto-rows',
      autoRows: 'grid-auto-rows',
      'auto-flow': 'grid-auto-flow',
      autoFlow: 'grid-auto-flow',
      row: 'grid-row',
      column: 'grid-column',
      'row-start': 'grid-row-start',
      rowStart: 'grid-row-start',
      'row-end': 'grid-row-end',
      rowEnd: 'grid-row-end',
      'column-start': 'grid-column-start',
      columnStart: 'grid-column-start',
      'column-end': 'grid-column-end',
      columnEnd: 'grid-column-end',
      area: 'grid-area',
      gap: 'grid-gap',
      'row-gap': 'grid-row-gap',
      rowGap: 'grid-row-gap',
      'column-gap': 'grid-column-gap',
      columnGap: 'grid-column-gap'
    }
  };
  /* eslint-disable no-use-before-define */

  /**
   * Map values by given prop.
   *
   * @param {Array} array of values
   * @param {String} original property
   * @param {String} original rule
   * @return {String} mapped values
   */

  function mapValuesByProp(value, prop, rule) {
    return value.map(function (item) {
      return objectToArray(item, prop, rule, false, true);
    });
  }
  /**
   * Convert array to nested array, if needed
   */


  function processArray(value, prop, scheme, rule) {
    if (scheme[prop] == null) return value;
    if (value.length === 0) return [];
    if (Array.isArray(value[0])) return processArray(value[0], prop, scheme, rule);

    if (typeof value[0] === 'object') {
      return mapValuesByProp(value, prop, rule);
    }

    return [value];
  }
  /**
   * Convert object to array.
   */


  function objectToArray(value, prop, rule, isFallback, isInArray) {
    if (!(propObj[prop] || customPropObj[prop])) return [];
    var result = []; // Check if exists any non-standard property

    if (customPropObj[prop]) {
      // eslint-disable-next-line no-param-reassign
      value = customPropsToStyle(value, rule, customPropObj[prop], isFallback);
    } // Pass throught all standart props


    if (Object.keys(value).length) {
      for (var baseProp in propObj[prop]) {
        if (value[baseProp]) {
          if (Array.isArray(value[baseProp])) {
            result.push(propArrayInObj[baseProp] === null ? value[baseProp] : value[baseProp].join(' '));
          } else result.push(value[baseProp]);

          continue;
        } // Add default value from props config.


        if (propObj[prop][baseProp] != null) {
          result.push(propObj[prop][baseProp]);
        }
      }
    }

    if (!result.length || isInArray) return result;
    return [result];
  }
  /**
   * Convert custom properties values to styles adding them to rule directly
   */


  function customPropsToStyle(value, rule, customProps, isFallback) {
    for (var prop in customProps) {
      var propName = customProps[prop]; // If current property doesn't exist already in rule - add new one

      if (typeof value[prop] !== 'undefined' && (isFallback || !rule.prop(propName))) {
        var _styleDetector;

        var appendedValue = styleDetector((_styleDetector = {}, _styleDetector[propName] = value[prop], _styleDetector), rule)[propName]; // Add style directly in rule

        if (isFallback) rule.style.fallbacks[propName] = appendedValue;else rule.style[propName] = appendedValue;
      } // Delete converted property to avoid double converting


      delete value[prop];
    }

    return value;
  }
  /**
   * Detect if a style needs to be converted.
   */


  function styleDetector(style, rule, isFallback) {
    for (var prop in style) {
      var value = style[prop];

      if (Array.isArray(value)) {
        // Check double arrays to avoid recursion.
        if (!Array.isArray(value[0])) {
          if (prop === 'fallbacks') {
            for (var index = 0; index < style.fallbacks.length; index++) {
              style.fallbacks[index] = styleDetector(style.fallbacks[index], rule, true);
            }

            continue;
          }

          style[prop] = processArray(value, prop, propArray, rule); // Avoid creating properties with empty values

          if (!style[prop].length) delete style[prop];
        }
      } else if (typeof value === 'object') {
        if (prop === 'fallbacks') {
          style.fallbacks = styleDetector(style.fallbacks, rule, true);
          continue;
        }

        style[prop] = objectToArray(value, prop, rule, isFallback); // Avoid creating properties with empty values

        if (!style[prop].length) delete style[prop];
      } // Maybe a computed value resulting in an empty string
      else if (style[prop] === '') delete style[prop];
    }

    return style;
  }
  /**
   * Adds possibility to write expanded styles.
   */


  function jssExpand() {
    function onProcessStyle(style, rule) {
      if (!style || rule.type !== 'style') return style;

      if (Array.isArray(style)) {
        // Pass rules one by one and reformat them
        for (var index = 0; index < style.length; index++) {
          style[index] = styleDetector(style[index], rule);
        }

        return style;
      }

      return styleDetector(style, rule);
    }

    return {
      onProcessStyle: onProcessStyle
    };
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  // Export javascript style and css style vendor prefixes.
  var js = '';
  var css = '';
  var vendor = '';
  var browser = '';
  var isTouch = isBrowser && 'ontouchstart' in document.documentElement; // We should not do anything if required serverside.

  if (isBrowser) {
    // Order matters. We need to check Webkit the last one because
    // other vendors use to add Webkit prefixes to some properties
    var jsCssMap = {
      Moz: '-moz-',
      ms: '-ms-',
      O: '-o-',
      Webkit: '-webkit-'
    };

    var _document$createEleme = document.createElement('p'),
        style = _document$createEleme.style;

    var testProp = 'Transform';

    for (var key in jsCssMap) {
      if (key + testProp in style) {
        js = key;
        css = jsCssMap[key];
        break;
      }
    } // Correctly detect the Edge browser.


    if (js === 'Webkit' && 'msHyphens' in style) {
      js = 'ms';
      css = jsCssMap.ms;
      browser = 'edge';
    } // Correctly detect the Safari browser.


    if (js === 'Webkit' && '-apple-trailing-word' in style) {
      vendor = 'apple';
    }
  }
  /**
   * Vendor prefix string for the current browser.
   *
   * @type {{js: String, css: String, vendor: String, browser: String}}
   * @api public
   */


  var prefix = {
    js: js,
    css: css,
    vendor: vendor,
    browser: browser,
    isTouch: isTouch
  };

  /**
   * Test if a keyframe at-rule should be prefixed or not
   *
   * @param {String} vendor prefix string for the current browser.
   * @return {String}
   * @api public
   */

  function supportedKeyframes(key) {
    // Keyframes is already prefixed. e.g. key = '@-webkit-keyframes a'
    if (key[1] === '-') return key; // No need to prefix IE/Edge. Older browsers will ignore unsupported rules.
    // https://caniuse.com/#search=keyframes

    if (prefix.js === 'ms') return key;
    return "@" + prefix.css + "keyframes" + key.substr(10);
  }

  // https://caniuse.com/#search=appearance

  var appearence = {
    noPrefill: ['appearance'],
    supportedProperty: function supportedProperty(prop) {
      if (prop !== 'appearance') return false;
      if (prefix.js === 'ms') return "-webkit-" + prop;
      return prefix.css + prop;
    }
  };

  // https://caniuse.com/#search=color-adjust

  var colorAdjust = {
    noPrefill: ['color-adjust'],
    supportedProperty: function supportedProperty(prop) {
      if (prop !== 'color-adjust') return false;
      if (prefix.js === 'Webkit') return prefix.css + "print-" + prop;
      return prop;
    }
  };

  var regExp = /[-\s]+(.)?/g;
  /**
   * Replaces the letter with the capital letter
   *
   * @param {String} match
   * @param {String} c
   * @return {String}
   * @api private
   */

  function toUpper(match, c) {
    return c ? c.toUpperCase() : '';
  }
  /**
   * Convert dash separated strings to camel-cased.
   *
   * @param {String} str
   * @return {String}
   * @api private
   */


  function camelize(str) {
    return str.replace(regExp, toUpper);
  }

  /**
   * Convert dash separated strings to pascal cased.
   *
   * @param {String} str
   * @return {String}
   * @api private
   */

  function pascalize(str) {
    return camelize("-" + str);
  }

  // but we can use a longhand property instead.
  // https://caniuse.com/#search=mask

  var mask = {
    noPrefill: ['mask'],
    supportedProperty: function supportedProperty(prop, style) {
      if (!/^mask/.test(prop)) return false;

      if (prefix.js === 'Webkit') {
        var longhand = 'mask-image';

        if (camelize(longhand) in style) {
          return prop;
        }

        if (prefix.js + pascalize(longhand) in style) {
          return prefix.css + prop;
        }
      }

      return prop;
    }
  };

  // https://caniuse.com/#search=text-orientation

  var textOrientation = {
    noPrefill: ['text-orientation'],
    supportedProperty: function supportedProperty(prop) {
      if (prop !== 'text-orientation') return false;

      if (prefix.vendor === 'apple' && !prefix.isTouch) {
        return prefix.css + prop;
      }

      return prop;
    }
  };

  // https://caniuse.com/#search=transform

  var transform = {
    noPrefill: ['transform'],
    supportedProperty: function supportedProperty(prop, style, options) {
      if (prop !== 'transform') return false;

      if (options.transform) {
        return prop;
      }

      return prefix.css + prop;
    }
  };

  // https://caniuse.com/#search=transition

  var transition = {
    noPrefill: ['transition'],
    supportedProperty: function supportedProperty(prop, style, options) {
      if (prop !== 'transition') return false;

      if (options.transition) {
        return prop;
      }

      return prefix.css + prop;
    }
  };

  // https://caniuse.com/#search=writing-mode

  var writingMode = {
    noPrefill: ['writing-mode'],
    supportedProperty: function supportedProperty(prop) {
      if (prop !== 'writing-mode') return false;

      if (prefix.js === 'Webkit' || prefix.js === 'ms' && prefix.browser !== 'edge') {
        return prefix.css + prop;
      }

      return prop;
    }
  };

  // https://caniuse.com/#search=user-select

  var userSelect = {
    noPrefill: ['user-select'],
    supportedProperty: function supportedProperty(prop) {
      if (prop !== 'user-select') return false;

      if (prefix.js === 'Moz' || prefix.js === 'ms' || prefix.vendor === 'apple') {
        return prefix.css + prop;
      }

      return prop;
    }
  };

  // https://caniuse.com/#search=multicolumn
  // https://github.com/postcss/autoprefixer/issues/491
  // https://github.com/postcss/autoprefixer/issues/177

  var breakPropsOld = {
    supportedProperty: function supportedProperty(prop, style) {
      if (!/^break-/.test(prop)) return false;

      if (prefix.js === 'Webkit') {
        var jsProp = "WebkitColumn" + pascalize(prop);
        return jsProp in style ? prefix.css + "column-" + prop : false;
      }

      if (prefix.js === 'Moz') {
        var _jsProp = "page" + pascalize(prop);

        return _jsProp in style ? "page-" + prop : false;
      }

      return false;
    }
  };

  // See https://github.com/postcss/autoprefixer/issues/324.

  var inlineLogicalOld = {
    supportedProperty: function supportedProperty(prop, style) {
      if (!/^(border|margin|padding)-inline/.test(prop)) return false;
      if (prefix.js === 'Moz') return prop;
      var newProp = prop.replace('-inline', '');
      return prefix.js + pascalize(newProp) in style ? prefix.css + newProp : false;
    }
  };

  // Camelization is required because we can't test using.
  // CSS syntax for e.g. in FF.

  var unprefixed = {
    supportedProperty: function supportedProperty(prop, style) {
      return camelize(prop) in style ? prop : false;
    }
  };

  var prefixed = {
    supportedProperty: function supportedProperty(prop, style) {
      var pascalized = pascalize(prop); // Return custom CSS variable without prefixing.

      if (prop[0] === '-') return prop; // Return already prefixed value without prefixing.

      if (prop[0] === '-' && prop[1] === '-') return prop;
      if (prefix.js + pascalized in style) return prefix.css + prop; // Try webkit fallback.

      if (prefix.js !== 'Webkit' && "Webkit" + pascalized in style) return "-webkit-" + prop;
      return false;
    }
  };

  // https://caniuse.com/#search=scroll-snap

  var scrollSnap = {
    supportedProperty: function supportedProperty(prop) {
      if (prop.substring(0, 11) !== 'scroll-snap') return false;

      if (prefix.js === 'ms') {
        return "" + prefix.css + prop;
      }

      return prop;
    }
  };

  // https://caniuse.com/#search=overscroll-behavior

  var overscrollBehavior = {
    supportedProperty: function supportedProperty(prop) {
      if (prop !== 'overscroll-behavior') return false;

      if (prefix.js === 'ms') {
        return prefix.css + "scroll-chaining";
      }

      return prop;
    }
  };

  var propMap = {
    'flex-grow': 'flex-positive',
    'flex-shrink': 'flex-negative',
    'flex-basis': 'flex-preferred-size',
    'justify-content': 'flex-pack',
    order: 'flex-order',
    'align-items': 'flex-align',
    'align-content': 'flex-line-pack' // 'align-self' is handled by 'align-self' plugin.

  }; // Support old flex spec from 2012.

  var flex2012 = {
    supportedProperty: function supportedProperty(prop, style) {
      var newProp = propMap[prop];
      if (!newProp) return false;
      return prefix.js + pascalize(newProp) in style ? prefix.css + newProp : false;
    }
  };

  var propMap$1 = {
    flex: 'box-flex',
    'flex-grow': 'box-flex',
    'flex-direction': ['box-orient', 'box-direction'],
    order: 'box-ordinal-group',
    'align-items': 'box-align',
    'flex-flow': ['box-orient', 'box-direction'],
    'justify-content': 'box-pack'
  };
  var propKeys = Object.keys(propMap$1);

  var prefixCss = function prefixCss(p) {
    return prefix.css + p;
  }; // Support old flex spec from 2009.


  var flex2009 = {
    supportedProperty: function supportedProperty(prop, style, _ref) {
      var multiple = _ref.multiple;

      if (propKeys.indexOf(prop) > -1) {
        var newProp = propMap$1[prop];

        if (!Array.isArray(newProp)) {
          return prefix.js + pascalize(newProp) in style ? prefix.css + newProp : false;
        }

        if (!multiple) return false;

        for (var i = 0; i < newProp.length; i++) {
          if (!(prefix.js + pascalize(newProp[0]) in style)) {
            return false;
          }
        }

        return newProp.map(prefixCss);
      }

      return false;
    }
  };

  // plugins = [
  //   ...plugins,
  //    breakPropsOld,
  //    inlineLogicalOld,
  //    unprefixed,
  //    prefixed,
  //    scrollSnap,
  //    flex2012,
  //    flex2009
  // ]
  // Plugins without 'noPrefill' value, going last.
  // 'flex-*' plugins should be at the bottom.
  // 'flex2009' going after 'flex2012'.
  // 'prefixed' going after 'unprefixed'

  var plugins = [appearence, colorAdjust, mask, textOrientation, transform, transition, writingMode, userSelect, breakPropsOld, inlineLogicalOld, unprefixed, prefixed, scrollSnap, overscrollBehavior, flex2012, flex2009];
  var propertyDetectors = plugins.filter(function (p) {
    return p.supportedProperty;
  }).map(function (p) {
    return p.supportedProperty;
  });
  var noPrefill = plugins.filter(function (p) {
    return p.noPrefill;
  }).reduce(function (a, p) {
    a.push.apply(a, _toConsumableArray(p.noPrefill));
    return a;
  }, []);

  var el;
  var cache$1 = {};

  if (isBrowser) {
    el = document.createElement('p'); // We test every property on vendor prefix requirement.
    // Once tested, result is cached. It gives us up to 70% perf boost.
    // http://jsperf.com/element-style-object-access-vs-plain-object
    //
    // Prefill cache with known css properties to reduce amount of
    // properties we need to feature test at runtime.
    // http://davidwalsh.name/vendor-prefix

    var computed = window.getComputedStyle(document.documentElement, '');

    for (var key$1 in computed) {
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(key$1)) cache$1[computed[key$1]] = computed[key$1];
    } // Properties that cannot be correctly detected using the
    // cache prefill method.


    noPrefill.forEach(function (x) {
      return delete cache$1[x];
    });
  }
  /**
   * Test if a property is supported, returns supported property with vendor
   * prefix if required. Returns `false` if not supported.
   *
   * @param {String} prop dash separated
   * @param {Object} [options]
   * @return {String|Boolean}
   * @api public
   */


  function supportedProperty(prop, options) {
    if (options === void 0) {
      options = {};
    }

    // For server-side rendering.
    if (!el) return prop; // Remove cache for benchmark tests or return property from the cache.

    if ( cache$1[prop] != null) {
      return cache$1[prop];
    } // Check if 'transition' or 'transform' natively supported in browser.


    if (prop === 'transition' || prop === 'transform') {
      options[prop] = prop in el.style;
    } // Find a plugin for current prefix property.


    for (var i = 0; i < propertyDetectors.length; i++) {
      cache$1[prop] = propertyDetectors[i](prop, el.style, options); // Break loop, if value found.

      if (cache$1[prop]) break;
    } // Reset styles for current property.
    // Firefox can even throw an error for invalid properties, e.g., "0".


    try {
      el.style[prop] = '';
    } catch (err) {
      return false;
    }

    return cache$1[prop];
  }

  var cache$1$1 = {};
  var transitionProperties = {
    transition: 1,
    'transition-property': 1,
    '-webkit-transition': 1,
    '-webkit-transition-property': 1
  };
  var transPropsRegExp = /(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g;
  var el$1;
  /**
   * Returns prefixed value transition/transform if needed.
   *
   * @param {String} match
   * @param {String} p1
   * @param {String} p2
   * @return {String}
   * @api private
   */

  function prefixTransitionCallback(match, p1, p2) {
    if (p1 === 'var') return 'var';
    if (p1 === 'all') return 'all';
    if (p2 === 'all') return ', all';
    var prefixedValue = p1 ? supportedProperty(p1) : ", " + supportedProperty(p2);
    if (!prefixedValue) return p1 || p2;
    return prefixedValue;
  }

  if (isBrowser) el$1 = document.createElement('p');
  /**
   * Returns prefixed value if needed. Returns `false` if value is not supported.
   *
   * @param {String} property
   * @param {String} value
   * @return {String|Boolean}
   * @api public
   */

  function supportedValue(property, value) {
    // For server-side rendering.
    var prefixedValue = value;
    if (!el$1 || property === 'content') return value; // It is a string or a number as a string like '1'.
    // We want only prefixable values here.
    // eslint-disable-next-line no-restricted-globals

    if (typeof prefixedValue !== 'string' || !isNaN(parseInt(prefixedValue, 10))) {
      return prefixedValue;
    } // Create cache key for current value.


    var cacheKey = property + prefixedValue; // Remove cache for benchmark tests or return value from cache.

    if ( cache$1$1[cacheKey] != null) {
      return cache$1$1[cacheKey];
    } // IE can even throw an error in some cases, for e.g. style.content = 'bar'.


    try {
      // Test value as it is.
      el$1.style[property] = prefixedValue;
    } catch (err) {
      // Return false if value not supported.
      cache$1$1[cacheKey] = false;
      return false;
    } // If 'transition' or 'transition-property' property.


    if (transitionProperties[property]) {
      prefixedValue = prefixedValue.replace(transPropsRegExp, prefixTransitionCallback);
    } else if (el$1.style[property] === '') {
      // Value with a vendor prefix.
      prefixedValue = prefix.css + prefixedValue; // Hardcode test to convert "flex" to "-ms-flexbox" for IE10.

      if (prefixedValue === '-ms-flex') el$1.style[property] = '-ms-flexbox'; // Test prefixed value.

      el$1.style[property] = prefixedValue; // Return false if value not supported.

      if (el$1.style[property] === '') {
        cache$1$1[cacheKey] = false;
        return false;
      }
    } // Reset styles for current property.


    el$1.style[property] = ''; // Write current value to cache.

    cache$1$1[cacheKey] = prefixedValue;
    return cache$1$1[cacheKey];
  }

  /**
   * Add vendor prefix to a property name when needed.
   */

  function jssVendorPrefixer() {
    function onProcessRule(rule) {
      if (rule.type === 'keyframes') {
        var atRule = rule;
        atRule.at = supportedKeyframes(atRule.at);
      }
    }

    function prefixStyle(style) {
      for (var prop in style) {
        var value = style[prop];

        if (prop === 'fallbacks' && Array.isArray(value)) {
          style[prop] = value.map(prefixStyle);
          continue;
        }

        var changeProp = false;
        var supportedProp = supportedProperty(prop);
        if (supportedProp && supportedProp !== prop) changeProp = true;
        var changeValue = false;
        var supportedValue$1 = supportedValue(supportedProp, jss.toCssValue(value));
        if (supportedValue$1 && supportedValue$1 !== value) changeValue = true;

        if (changeProp || changeValue) {
          if (changeProp) delete style[prop];
          style[supportedProp || prop] = supportedValue$1 || value;
        }
      }

      return style;
    }

    function onProcessStyle(style, rule) {
      if (rule.type !== 'style') return style;
      return prefixStyle(style);
    }

    function onChangeValue(value, prop) {
      return supportedValue(prop, jss.toCssValue(value)) || value;
    }

    return {
      onProcessRule: onProcessRule,
      onProcessStyle: onProcessStyle,
      onChangeValue: onChangeValue
    };
  }

  /**
   * Sort props by length.
   */
  function jssPropsSort() {
    var sort = function sort(prop0, prop1) {
      if (prop0.length === prop1.length) {
        return prop0 > prop1 ? 1 : -1;
      }

      return prop0.length - prop1.length;
    };

    return {
      onProcessStyle: function onProcessStyle(style, rule) {
        if (rule.type !== 'style') return style;
        var newStyle = {};
        var props = Object.keys(style).sort(sort);

        for (var i = 0; i < props.length; i++) {
          newStyle[props[i]] = style[props[i]];
        }

        return newStyle;
      }
    };
  }

  var create = function create(options) {
    if (options === void 0) {
      options = {};
    }

    return {
      plugins: [functionPlugin(), observablePlugin(options.observable), templatePlugin(), jssGlobal(), jssExtend(), jssNested(), jssCompose(), camelCase(), defaultUnit(options.defaultUnit), jssExpand(), jssVendorPrefixer(), jssPropsSort()]
    };
  };

  var defaultJss = jss.create(create());

  var sheetsMeta = new WeakMap();
  var getMeta = function getMeta(sheet) {
    return sheetsMeta.get(sheet);
  };
  var addMeta = function addMeta(sheet, meta) {
    sheetsMeta.set(sheet, meta);
  };

  var getStyles = function getStyles(options) {
    var styles = options.styles;

    if (typeof styles !== 'function') {
      return styles;
    }

     warning(styles.length !== 0, "[JSS] <" + (options.name || 'Hook') + " />'s styles function doesn't rely on the \"theme\" argument. We recommend declaring styles as an object instead.") ;
    return styles(options.theme);
  };

  function getSheetOptions(options, link) {
    var minify;

    if (options.context.id && options.context.id.minify != null) {
      minify = options.context.id.minify;
    }

    var classNamePrefix = options.context.classNamePrefix || '';

    if (options.name && !minify) {
      classNamePrefix += options.name.replace(/\s/g, '-') + "-";
    }

    var meta = '';
    if (options.name) meta = options.name + ", ";
    meta += typeof options.styles === 'function' ? 'Themed' : 'Unthemed';
    return _extends({}, options.sheetOptions, {
      index: options.index,
      meta: meta,
      classNamePrefix: classNamePrefix,
      link: link,
      generateId: options.sheetOptions && options.sheetOptions.generateId ? options.sheetOptions.generateId : options.context.generateId
    });
  }

  var createStyleSheet = function createStyleSheet(options) {
    if (options.context.disableStylesGeneration) {
      return undefined;
    }

    var manager = getManager(options.context, options.index);
    var existingSheet = manager.get(options.theme);

    if (existingSheet) {
      return existingSheet;
    }

    var jss$1 = options.context.jss || defaultJss;
    var styles = getStyles(options);
    var dynamicStyles = jss.getDynamicStyles(styles);
    var sheet = jss$1.createStyleSheet(styles, getSheetOptions(options, dynamicStyles !== null));
    addMeta(sheet, {
      dynamicStyles: dynamicStyles,
      styles: styles
    });
    manager.add(options.theme, sheet);
    return sheet;
  };
  var removeDynamicRules = function removeDynamicRules(sheet, rules) {
    // Loop over each dynamic rule and remove the dynamic rule
    // We can't just remove the whole sheet as this has all of the rules for every component instance
    for (var key in rules) {
      sheet.deleteRule(rules[key]);
    }
  };
  var updateDynamicRules = function updateDynamicRules(data, sheet, rules) {
    // Loop over each dynamic rule and update it
    // We can't just update the whole sheet as this has all of the rules for every component instance
    for (var key in rules) {
      sheet.updateOne(rules[key], data);
    }
  };
  var addDynamicRules = function addDynamicRules(sheet, data) {
    var meta = getMeta(sheet);

    if (!meta) {
      return undefined;
    }

    var rules = {}; // Loop over each dynamic rule and add it to the stylesheet

    for (var key in meta.dynamicStyles) {
      var initialRuleCount = sheet.rules.index.length;
      var originalRule = sheet.addRule(key, meta.dynamicStyles[key]); // Loop through all created rules, fixes updating dynamic rules

      for (var i = initialRuleCount; i < sheet.rules.index.length; i++) {
        var rule = sheet.rules.index[i];
        sheet.updateOne(rule, data); // If it's the original rule, we need to add it by the correct key so the hook and hoc
        // can correctly concat the dynamic class with the static one

        rules[originalRule === rule ? key : rule.key] = rule;
      }
    }

    return rules;
  };

  var getSheetClasses = function getSheetClasses(sheet, dynamicRules) {
    if (!dynamicRules) {
      return sheet.classes;
    }

    var meta = getMeta(sheet);

    if (!meta) {
      return sheet.classes;
    }

    var classes = {};

    for (var key in meta.styles) {
      classes[key] = sheet.classes[key];

      if (key in dynamicRules) {
        classes[key] += " " + sheet.classes[dynamicRules[key].key];
      }
    }

    return classes;
  };

  function getUseInsertionEffect(isSSR) {
    return isSSR ? React.useEffect : React__default['default'].useInsertionEffect || // React 18+ (https://github.com/reactwg/react-18/discussions/110)
    React.useLayoutEffect;
  }

  var noTheme = {};

  var createUseStyles = function createUseStyles(styles, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        _options$index = _options.index,
        index = _options$index === void 0 ? getSheetIndex() : _options$index,
        theming = _options.theming,
        name = _options.name,
        sheetOptions = _objectWithoutPropertiesLoose(_options, ["index", "theming", "name"]);

    var ThemeContext$1 = theming && theming.context || ThemeContext;

    var useTheme = function useTheme(theme) {
      if (typeof styles === 'function') {
        return theme || React.useContext(ThemeContext$1) || noTheme;
      }

      return noTheme;
    };

    var emptyObject = {};
    return function useStyles(data) {
      var isFirstMount = React.useRef(true);
      var context = React.useContext(JssContext);
      var theme = useTheme(data && data.theme);

      var _useMemo = React.useMemo(function () {
        var newSheet = createStyleSheet({
          context: context,
          styles: styles,
          name: name,
          theme: theme,
          index: index,
          sheetOptions: sheetOptions
        });

        if (newSheet && context.isSSR) {
          // manage immediately during SSRs. browsers will manage the sheet through useInsertionEffect below
          manageSheet({
            index: index,
            context: context,
            sheet: newSheet,
            theme: theme
          });
        }

        return [newSheet, newSheet ? addDynamicRules(newSheet, data) : null];
      }, [context, theme]),
          sheet = _useMemo[0],
          dynamicRules = _useMemo[1];

      getUseInsertionEffect(context.isSSR)(function () {
        // We only need to update the rules on a subsequent update and not in the first mount
        if (sheet && dynamicRules && !isFirstMount.current) {
          updateDynamicRules(data, sheet, dynamicRules);
        }
      }, [data]);
      getUseInsertionEffect(context.isSSR)(function () {
        if (sheet) {
          manageSheet({
            index: index,
            context: context,
            sheet: sheet,
            theme: theme
          });
        }

        return function () {
          if (sheet) {
            unmanageSheet({
              index: index,
              context: context,
              sheet: sheet,
              theme: theme
            }); // when sheet changes, remove related dynamic rules

            if (dynamicRules) {
              removeDynamicRules(sheet, dynamicRules);
            }
          }
        };
      }, [sheet]);
      var classes = React.useMemo(function () {
        return sheet && dynamicRules ? getSheetClasses(sheet, dynamicRules) : emptyObject;
      }, [sheet, dynamicRules]);
      React.useDebugValue(classes);
      React.useDebugValue(theme === noTheme ? 'No theme' : theme);
      React.useEffect(function () {
        isFirstMount.current = false;
      });
      return classes;
    };
  };

  var NoRenderer = function NoRenderer(props) {
    return props.children || null;
  };
  /**
   * HOC creator function that wrapps the user component.
   *
   * `withStyles(styles, [options])(Component)`
   */


  var createWithStyles = function createWithStyles(styles, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        _options$index = _options.index,
        index = _options$index === void 0 ? getSheetIndex() : _options$index,
        theming = _options.theming,
        injectTheme = _options.injectTheme,
        sheetOptions = _objectWithoutPropertiesLoose(_options, ["index", "theming", "injectTheme"]);

    var ThemeContext$1 = theming ? theming.context : ThemeContext;
    return function (InnerComponent) {
      if (InnerComponent === void 0) {
        InnerComponent = NoRenderer;
      }

      var displayName = getDisplayName$1(InnerComponent);
      var mergeClassesProp = memoize(function (sheetClasses, classesProp) {
        return classesProp ? mergeClasses(sheetClasses, classesProp) : sheetClasses;
      });
      var hookOptions = Object.assign(sheetOptions, {
        theming: theming,
        index: index,
        name: displayName
      });
      var useStyles = createUseStyles(styles, hookOptions);
      var WithStyles = React.forwardRef(function (props, ref) {
        var theme = React.useContext(ThemeContext$1);

        var newProps = _extends({}, props);

        if (injectTheme && newProps.theme == null) {
          newProps.theme = theme;
        }

        var sheetClasses = useStyles(newProps);
        var classes = mergeClassesProp(sheetClasses, props.classes);
        return React.createElement(InnerComponent, _extends({}, newProps, {
          classes: classes,
          ref: ref
        }));
      });
      WithStyles.displayName = "WithStyles(" + displayName + ")";
      WithStyles.defaultProps = _extends({}, InnerComponent.defaultProps);
      WithStyles.InnerComponent = InnerComponent;
      return hoistNonReactStatics_cjs(WithStyles, InnerComponent);
    };
  };

  function shallowEqualObjects(objA, objB) {
    if (objA === objB) {
      return true;
    }

    if (!objA || !objB) {
      return false;
    }

    var aKeys = Object.keys(objA);
    var bKeys = Object.keys(objB);
    var len = aKeys.length;

    if (bKeys.length !== len) {
      return false;
    }

    for (var i = 0; i < len; i++) {
      var key = aKeys[i];

      if (objA[key] !== objB[key]) {
        return false;
      }
    }

    return true;
  }

  var initialContext = {};
  function JssProvider(props) {
    var managersRef = React.useRef({});
    var prevContextRef = React.useRef();
    var registryRef = React.useRef(null);

    var createContext = function createContext(parentContext, prevContext) {
      if (prevContext === void 0) {
        prevContext = initialContext;
      }

      var registry = props.registry,
          classNamePrefix = props.classNamePrefix,
          jss$1 = props.jss,
          generateId = props.generateId,
          disableStylesGeneration = props.disableStylesGeneration,
          media = props.media,
          id = props.id,
          isSSR = props.isSSR;

      var context = _extends({}, parentContext);

      if (registry) {
        context.registry = registry; // This way we identify a new request on the server, because user will create
        // a new Registry instance for each.

        if (registry !== registryRef.current) {
          // We reset managers because we have to regenerate all sheets for the new request.
          managersRef.current = {};
          registryRef.current = registry;
        }
      }

      context.managers = managersRef.current;

      if (id !== undefined) {
        context.id = id;
      }

      if (generateId !== undefined) {
        context.generateId = generateId;
      } else if (!context.generateId || !prevContext || context.id !== prevContext.id) {
        context.generateId = jss.createGenerateId(context.id);
      }

      if (classNamePrefix) {
        context.classNamePrefix = (context.classNamePrefix || '') + classNamePrefix;
      }

      if (media !== undefined) {
        context.media = media;
      }

      if (jss$1) {
        context.jss = jss$1;
      }

      if (disableStylesGeneration !== undefined) {
        context.disableStylesGeneration = disableStylesGeneration;
      }

      if (isSSR !== undefined) {
        context.isSSR = isSSR;
      }

      if (prevContext && shallowEqualObjects(prevContext, context)) {
        return prevContext;
      }

      return context;
    };

    var renderProvider = function renderProvider(parentContext) {
      var children = props.children;
      var context = createContext(parentContext, prevContextRef.current);
      prevContextRef.current = context;
      return React.createElement(JssContext.Provider, {
        value: context
      }, children);
    };

    return React.createElement(JssContext.Consumer, null, renderProvider);
  }

  function memoize$1(fn) {
    var cache = {};
    return function (arg) {
      if (cache[arg] === undefined) cache[arg] = fn(arg);
      return cache[arg];
    };
  }

  var reactPropsRegex = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|default|defer|dir|disabled|download|draggable|encType|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|itemProp|itemScope|itemType|itemID|itemRef|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/; // https://esbench.com/bench/5bfee68a4cd7e6009ef61d23

  var index$1 = memoize$1(function (prop) {
    return reactPropsRegex.test(prop) || prop.charCodeAt(0) === 111
    /* o */
    && prop.charCodeAt(1) === 110
    /* n */
    && prop.charCodeAt(2) < 91;
  }
  /* Z+1 */
  );

  var parseStyles = function parseStyles(args) {
    var dynamicStyles = [];
    var staticStyle;
    var labels = []; // Not using ...rest to optimize perf.

    for (var key in args) {
      var style = args[key];
      if (!style) continue;

      if (typeof style === 'function') {
        dynamicStyles.push(style);
      } else {
        if (!staticStyle) staticStyle = {};
        Object.assign(staticStyle, style);
        var _staticStyle = staticStyle,
            _label = _staticStyle.label;

        if (_label) {
          if (labels.indexOf(_label) === -1) labels.push(_label);
        }
      }
    }

    var styles = {};
    var label = labels.length === 0 ? 'sc' : labels.join('-');

    if (staticStyle) {
      // Label should not leak to the core.
      if ('label' in staticStyle) delete staticStyle.label;
      styles[label] = staticStyle;
    } // When there is only one function rule, we don't need to wrap it.


    if (dynamicStyles.length === 1) {
      styles.scd = dynamicStyles[0];
    } // We create a new function rule which will call all other function rules
    // and merge the styles they return.


    if (dynamicStyles.length > 1) {
      styles.scd = function (props) {
        var merged = {};

        for (var i = 0; i < dynamicStyles.length; i++) {
          var dynamicStyle = dynamicStyles[i](props);
          if (dynamicStyle) Object.assign(merged, dynamicStyle);
        }

        return merged;
      };
    }

    return {
      styles: styles,
      label: label
    };
  };

  var shouldForwardPropSymbol = Symbol('react-jss-styled');

  var getShouldForwardProp = function getShouldForwardProp(tagOrComponent, options) {
    var shouldForwardProp = options.shouldForwardProp;
    var childShouldForwardProp = tagOrComponent[shouldForwardPropSymbol];
    var finalShouldForwardProp = shouldForwardProp || childShouldForwardProp;

    if (shouldForwardProp && childShouldForwardProp) {
      finalShouldForwardProp = function finalShouldForwardProp(prop) {
        return childShouldForwardProp(prop) && shouldForwardProp(prop);
      };
    }

    return finalShouldForwardProp;
  };

  var getChildProps = function getChildProps(props, shouldForwardProp, isTag) {
    var childProps = {};

    for (var prop in props) {
      if (shouldForwardProp) {
        if (shouldForwardProp(prop) === true) {
          childProps[prop] = props[prop];
        }

        continue;
      } // We don't want to pass non-dom props to the DOM.


      if (isTag) {
        if (index$1(prop)) {
          childProps[prop] = props[prop];
        }

        continue;
      }

      childProps[prop] = props[prop];
    }

    return childProps;
  }; // eslint-disable-next-line no-unused-vars


  var configureStyled = function configureStyled(tagOrComponent, options) {
    if (options === void 0) {
      options = {};
    }

    var _options = options,
        theming = _options.theming;
    var isTag = typeof tagOrComponent === 'string';
    var ThemeContext$1 = theming ? theming.context : ThemeContext;
    var shouldForwardProp = getShouldForwardProp(tagOrComponent, options);

    var _options2 = options,
        _ = _options2.shouldForwardProp,
        hookOptions = _objectWithoutPropertiesLoose(_options2, ["shouldForwardProp"]);

    return function createStyledComponent() {
      // eslint-disable-next-line prefer-rest-params
      var _parseStyles = parseStyles(arguments),
          styles = _parseStyles.styles,
          label = _parseStyles.label;

      var useStyles = createUseStyles(styles, hookOptions);

      var Styled = function Styled(props) {
        var as = props.as,
            className = props.className;
        var theme = React.useContext(ThemeContext$1);
        var propsWithTheme = Object.assign({
          theme: theme
        }, props);
        var classes = useStyles(propsWithTheme);
        var childProps = getChildProps(props, shouldForwardProp, isTag);
        var classNames = ((classes[label] || classes.sc || '') + " " + (classes.scd || '')).trim();
        childProps.className = className ? className + " " + classNames : classNames;

        if (!isTag && shouldForwardProp) {
          tagOrComponent[shouldForwardPropSymbol] = shouldForwardProp;
        }

        if (isTag && as) {
          return React.createElement(as, childProps);
        }

        return React.createElement(tagOrComponent, childProps);
      };

      return Styled;
    };
  };

  var MAX_RULES_PER_SHEET = 10000;
  var defaultJss$1 = jss.create(create());

  var createCss = function createCss(jss) {
    if (jss === void 0) {
      jss = defaultJss$1;
    }

    var cache = new Map();
    var ruleIndex = 0;
    var sheet;

    var getSheet = function getSheet() {
      if (!sheet || sheet.rules.index.length > MAX_RULES_PER_SHEET) {
        sheet = jss.createStyleSheet().attach();
      }

      return sheet;
    };

    function css() {
      // eslint-disable-next-line prefer-rest-params
      var args = arguments; // We can avoid the need for stringification with a babel plugin,
      // which could generate a hash at build time and add it to the object.

      var argsStr = JSON.stringify(args);
      var cached = cache.get(argsStr);
      if (cached) return cached.className;
      var flatArgs = []; // Flatten arguments which can be
      // - style objects
      // - array of style objects
      // - arrays of style objects

      for (var argIndex in args) {
        var arg = args[argIndex];

        if (!Array.isArray(arg)) {
          flatArgs.push(arg);
          continue;
        }

        for (var innerArgIndex = 0; innerArgIndex < arg.length; innerArgIndex++) {
          flatArgs.push(arg[innerArgIndex]);
        }
      }

      var mergedStyle = {};
      var labels = [];

      for (var i = 0; i < flatArgs.length; i++) {
        var style = flatArgs[i];
        if (!style) continue;
        var styleObject = style; // It can be a class name that css() has previously generated.

        if (typeof style === 'string') {
          // eslint-disable-next-line no-shadow
          var _cached = cache.get(style);

          if (_cached) {
            // eslint-disable-next-line prefer-spread
            if (_cached.labels.length) labels.push.apply(labels, _cached.labels);
            styleObject = _cached.style;
          }
        }

        if (styleObject.label && labels.indexOf(styleObject.label) === -1) labels.push(styleObject.label);
        Object.assign(mergedStyle, styleObject);
      }

      delete mergedStyle.label;
      var label = labels.length === 0 ? 'css' : labels.join('-');
      var key = label + "-" + ruleIndex++;
      getSheet().addRule(key, mergedStyle);
      var className = getSheet().classes[key];
      var cacheValue = {
        style: mergedStyle,
        labels: labels,
        className: className
      };
      cache.set(argsStr, cacheValue);
      cache.set(className, cacheValue);
      return className;
    } // For testing only.


    css.getSheet = getSheet;
    return css;
  };

  var css$1 = createCss();

  /* eslint-disable prefer-rest-params, prefer-spread */
  var create$1 = function create(css) {
    if (css === void 0) {
      css = css$1;
    }

    return function createElement(type, props) {
      var args = arguments;

      if (props && props.css) {
        var className = css(props.css);
        var newProps = Object.assign({}, props);
        newProps.className = props.className ? props.className + " " + className : className;
        delete newProps.css;
        args[1] = newProps;
      }

      return React.createElement.apply(undefined, args);
    };
  };
  var jsx = create$1();

  Object.defineProperty(exports, 'SheetsRegistry', {
    enumerable: true,
    get: function () {
      return jss.SheetsRegistry;
    }
  });
  Object.defineProperty(exports, 'createGenerateId', {
    enumerable: true,
    get: function () {
      return jss.createGenerateId;
    }
  });
  exports.JssContext = JssContext;
  exports.JssProvider = JssProvider;
  exports.ThemeProvider = ThemeProvider;
  exports.createJsx = create$1;
  exports.createTheming = createTheming;
  exports.createUseStyles = createUseStyles;
  exports.default = createWithStyles;
  exports.jss = defaultJss;
  exports.jsx = jsx;
  exports.styled = configureStyled;
  exports.useTheme = useTheme;
  exports.withStyles = createWithStyles;
  exports.withTheme = withTheme;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=react-jss.js.map
