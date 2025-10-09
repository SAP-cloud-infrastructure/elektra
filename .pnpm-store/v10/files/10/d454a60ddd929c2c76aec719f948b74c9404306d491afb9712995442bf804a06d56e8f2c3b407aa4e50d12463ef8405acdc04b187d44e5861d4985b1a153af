"use strict";
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _router, _routerState, _style, _className, _shadowDOMTarget, _isMounted, _setIsOpen, _dispose, _Component;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const web = require("solid-js/web");
const solidJs = require("solid-js");
const context = require("./context.cjs");
class TanStackRouterDevtoolsPanelCore {
  constructor(config) {
    __privateAdd(this, _router);
    __privateAdd(this, _routerState);
    __privateAdd(this, _style);
    __privateAdd(this, _className);
    __privateAdd(this, _shadowDOMTarget);
    __privateAdd(this, _isMounted, false);
    __privateAdd(this, _setIsOpen);
    __privateAdd(this, _dispose);
    __privateAdd(this, _Component);
    const {
      router,
      routerState,
      shadowDOMTarget,
      setIsOpen,
      style,
      className
    } = config;
    __privateSet(this, _router, solidJs.createSignal(router));
    __privateSet(this, _routerState, solidJs.createSignal(routerState));
    __privateSet(this, _style, solidJs.createSignal(style));
    __privateSet(this, _className, solidJs.createSignal(className));
    __privateSet(this, _shadowDOMTarget, shadowDOMTarget);
    __privateSet(this, _setIsOpen, setIsOpen);
  }
  mount(el) {
    if (__privateGet(this, _isMounted)) {
      throw new Error("Devtools is already mounted");
    }
    const dispose = web.render(() => {
      const [router] = __privateGet(this, _router);
      const [routerState] = __privateGet(this, _routerState);
      const [style] = __privateGet(this, _style);
      const [className] = __privateGet(this, _className);
      const shadowDOMTarget = __privateGet(this, _shadowDOMTarget);
      const setIsOpen = __privateGet(this, _setIsOpen);
      let BaseTanStackRouterDevtoolsPanel;
      if (__privateGet(this, _Component)) {
        BaseTanStackRouterDevtoolsPanel = __privateGet(this, _Component);
      } else {
        BaseTanStackRouterDevtoolsPanel = solidJs.lazy(() => Promise.resolve().then(() => require("./BaseTanStackRouterDevtoolsPanel.cjs")));
        __privateSet(this, _Component, BaseTanStackRouterDevtoolsPanel);
      }
      return web.createComponent(context.ShadowDomTargetContext.Provider, {
        value: shadowDOMTarget,
        get children() {
          return web.createComponent(context.DevtoolsOnCloseContext.Provider, {
            value: {
              onCloseClick: () => {
              }
            },
            get children() {
              return web.createComponent(BaseTanStackRouterDevtoolsPanel, {
                router,
                routerState,
                shadowDOMTarget,
                setIsOpen,
                style,
                className
              });
            }
          });
        }
      });
    }, el);
    __privateSet(this, _isMounted, true);
    __privateSet(this, _dispose, dispose);
  }
  unmount() {
    var _a;
    if (!__privateGet(this, _isMounted)) {
      throw new Error("Devtools is not mounted");
    }
    (_a = __privateGet(this, _dispose)) == null ? void 0 : _a.call(this);
    __privateSet(this, _isMounted, false);
  }
  setRouter(router) {
    __privateGet(this, _router)[1](router);
  }
  setRouterState(routerState) {
    __privateGet(this, _routerState)[1](routerState);
  }
  setStyle(style) {
    __privateGet(this, _style)[1](style);
  }
  setClassName(className) {
    __privateGet(this, _className)[1](className);
  }
  setOptions(options) {
    if (options.shadowDOMTarget !== void 0) {
      __privateSet(this, _shadowDOMTarget, options.shadowDOMTarget);
    }
    if (options.router !== void 0) {
      this.setRouter(options.router);
    }
    if (options.routerState !== void 0) {
      this.setRouterState(options.routerState);
    }
    if (options.style !== void 0) {
      this.setStyle(options.style);
    }
    if (options.className !== void 0) {
      this.setClassName(options.className);
    }
  }
}
_router = new WeakMap();
_routerState = new WeakMap();
_style = new WeakMap();
_className = new WeakMap();
_shadowDOMTarget = new WeakMap();
_isMounted = new WeakMap();
_setIsOpen = new WeakMap();
_dispose = new WeakMap();
_Component = new WeakMap();
exports.TanStackRouterDevtoolsPanelCore = TanStackRouterDevtoolsPanelCore;
//# sourceMappingURL=TanStackRouterDevtoolsPanelCore.cjs.map
