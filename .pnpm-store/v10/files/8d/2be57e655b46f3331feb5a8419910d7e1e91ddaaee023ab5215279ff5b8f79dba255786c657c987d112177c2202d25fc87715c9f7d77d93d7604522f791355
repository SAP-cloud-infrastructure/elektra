import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import React, { createContext, useRef, useContext, useMemo, useEffect, useLayoutEffect, useDebugValue, forwardRef, createElement } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { ThemeContext } from 'theming';
export { ThemeProvider, createTheming, useTheme, withTheme } from 'theming';
import isInBrowser from 'is-in-browser';
import warning from 'tiny-warning';
import { SheetsManager, create as create$1, getDynamicStyles, createGenerateId } from 'jss';
export { SheetsRegistry, createGenerateId } from 'jss';
import preset from 'jss-preset-default';
import { shallowEqualObjects } from 'shallow-equal';
import isPropValid from '@emotion/is-prop-valid';
import defaultCss from 'css-jss';

var getDisplayName = function getDisplayName(Component) {
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

var JssContext = createContext({
  classNamePrefix: '',
  disableStylesGeneration: false,
  isSSR: !isInBrowser
});

var defaultManagers = new Map();
var getManager = function getManager(context, managerId) {
  // If `managers` map is present in the context, we use it in order to
  // let JssProvider reset them when new response has to render server-side.
  var managers = context.managers;

  if (managers) {
    if (!managers[managerId]) {
      managers[managerId] = new SheetsManager();
    }

    return managers[managerId];
  }

  var manager = defaultManagers.get(managerId);

  if (!manager) {
    manager = new SheetsManager();
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

var defaultJss = create$1(preset());

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

  process.env.NODE_ENV !== "production" ? warning(styles.length !== 0, "[JSS] <" + (options.name || 'Hook') + " />'s styles function doesn't rely on the \"theme\" argument. We recommend declaring styles as an object instead.") : void 0;
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

  var jss = options.context.jss || defaultJss;
  var styles = getStyles(options);
  var dynamicStyles = getDynamicStyles(styles);
  var sheet = jss.createStyleSheet(styles, getSheetOptions(options, dynamicStyles !== null));
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
  return isSSR ? useEffect : React.useInsertionEffect || // React 18+ (https://github.com/reactwg/react-18/discussions/110)
  useLayoutEffect;
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
      return theme || useContext(ThemeContext$1) || noTheme;
    }

    return noTheme;
  };

  var emptyObject = {};
  return function useStyles(data) {
    var isFirstMount = useRef(true);
    var context = useContext(JssContext);
    var theme = useTheme(data && data.theme);

    var _useMemo = useMemo(function () {
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
    var classes = useMemo(function () {
      return sheet && dynamicRules ? getSheetClasses(sheet, dynamicRules) : emptyObject;
    }, [sheet, dynamicRules]);
    useDebugValue(classes);
    useDebugValue(theme === noTheme ? 'No theme' : theme);
    useEffect(function () {
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

    var displayName = getDisplayName(InnerComponent);
    var mergeClassesProp = memoize(function (sheetClasses, classesProp) {
      return classesProp ? mergeClasses(sheetClasses, classesProp) : sheetClasses;
    });
    var hookOptions = Object.assign(sheetOptions, {
      theming: theming,
      index: index,
      name: displayName
    });
    var useStyles = createUseStyles(styles, hookOptions);
    var WithStyles = forwardRef(function (props, ref) {
      var theme = useContext(ThemeContext$1);

      var newProps = _extends({}, props);

      if (injectTheme && newProps.theme == null) {
        newProps.theme = theme;
      }

      var sheetClasses = useStyles(newProps);
      var classes = mergeClassesProp(sheetClasses, props.classes);
      return createElement(InnerComponent, _extends({}, newProps, {
        classes: classes,
        ref: ref
      }));
    });
    WithStyles.displayName = "WithStyles(" + displayName + ")";
    WithStyles.defaultProps = _extends({}, InnerComponent.defaultProps);
    WithStyles.InnerComponent = InnerComponent;
    return hoistNonReactStatics(WithStyles, InnerComponent);
  };
};

var initialContext = {};
function JssProvider(props) {
  var managersRef = useRef({});
  var prevContextRef = useRef();
  var registryRef = useRef(null);

  var createContext = function createContext(parentContext, prevContext) {
    if (prevContext === void 0) {
      prevContext = initialContext;
    }

    var registry = props.registry,
        classNamePrefix = props.classNamePrefix,
        jss = props.jss,
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
      context.generateId = createGenerateId(context.id);
    }

    if (classNamePrefix) {
      context.classNamePrefix = (context.classNamePrefix || '') + classNamePrefix;
    }

    if (media !== undefined) {
      context.media = media;
    }

    if (jss) {
      context.jss = jss;
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
    return createElement(JssContext.Provider, {
      value: context
    }, children);
  };

  return createElement(JssContext.Consumer, null, renderProvider);
}

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
      if (isPropValid(prop)) {
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
      var theme = useContext(ThemeContext$1);
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
        return createElement(as, childProps);
      }

      return createElement(tagOrComponent, childProps);
    };

    return Styled;
  };
};

/* eslint-disable prefer-rest-params, prefer-spread */
var create = function create(css) {
  if (css === void 0) {
    css = defaultCss;
  }

  return function createElement$1(type, props) {
    var args = arguments;

    if (props && props.css) {
      var className = css(props.css);
      var newProps = Object.assign({}, props);
      newProps.className = props.className ? props.className + " " + className : className;
      delete newProps.css;
      args[1] = newProps;
    }

    return createElement.apply(undefined, args);
  };
};
var jsx = create();

export default createWithStyles;
export { JssContext, JssProvider, create as createJsx, createUseStyles, defaultJss as jss, jsx, configureStyled as styled, createWithStyles as withStyles };
