"use strict";
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _router, _routerState, _position, _initialIsOpen, _shadowDOMTarget, _panelProps, _closeButtonProps, _toggleButtonProps, _containerElement, _isMounted, _Component, _dispose;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const web = require("solid-js/web");
const solidJs = require("solid-js");
const context = require("./context.cjs");
class TanStackRouterDevtoolsCore {
  constructor(config) {
    __privateAdd(this, _router);
    __privateAdd(this, _routerState);
    __privateAdd(this, _position);
    __privateAdd(this, _initialIsOpen);
    __privateAdd(this, _shadowDOMTarget);
    __privateAdd(this, _panelProps);
    __privateAdd(this, _closeButtonProps);
    __privateAdd(this, _toggleButtonProps);
    __privateAdd(this, _containerElement);
    __privateAdd(this, _isMounted, false);
    __privateAdd(this, _Component);
    __privateAdd(this, _dispose);
    __privateSet(this, _router, solidJs.createSignal(config.router));
    __privateSet(this, _routerState, solidJs.createSignal(config.routerState));
    __privateSet(this, _position, config.position ?? "bottom-left");
    __privateSet(this, _initialIsOpen, config.initialIsOpen ?? false);
    __privateSet(this, _shadowDOMTarget, config.shadowDOMTarget);
    __privateSet(this, _panelProps, config.panelProps);
    __privateSet(this, _closeButtonProps, config.closeButtonProps);
    __privateSet(this, _toggleButtonProps, config.toggleButtonProps);
    __privateSet(this, _containerElement, config.containerElement);
  }
  mount(el) {
    if (__privateGet(this, _isMounted)) {
      throw new Error("Devtools is already mounted");
    }
    const dispose = web.render(() => {
      const [router] = __privateGet(this, _router);
      const [routerState] = __privateGet(this, _routerState);
      const position = __privateGet(this, _position);
      const initialIsOpen = __privateGet(this, _initialIsOpen);
      const shadowDOMTarget = __privateGet(this, _shadowDOMTarget);
      const panelProps = __privateGet(this, _panelProps);
      const closeButtonProps = __privateGet(this, _closeButtonProps);
      const toggleButtonProps = __privateGet(this, _toggleButtonProps);
      const containerElement = __privateGet(this, _containerElement);
      let Devtools;
      if (__privateGet(this, _Component)) {
        Devtools = __privateGet(this, _Component);
      } else {
        Devtools = solidJs.lazy(() => Promise.resolve().then(() => require("./FloatingTanStackRouterDevtools.cjs")));
        __privateSet(this, _Component, Devtools);
      }
      return web.createComponent(context.ShadowDomTargetContext.Provider, {
        value: shadowDOMTarget,
        get children() {
          return web.createComponent(Devtools, {
            position,
            initialIsOpen,
            router,
            routerState,
            shadowDOMTarget,
            panelProps,
            closeButtonProps,
            toggleButtonProps,
            containerElement
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
  setOptions(options) {
    if (options.position !== void 0) {
      __privateSet(this, _position, options.position);
    }
    if (options.initialIsOpen !== void 0) {
      __privateSet(this, _initialIsOpen, options.initialIsOpen);
    }
    if (options.shadowDOMTarget !== void 0) {
      __privateSet(this, _shadowDOMTarget, options.shadowDOMTarget);
    }
    if (options.containerElement !== void 0) {
      __privateSet(this, _containerElement, options.containerElement);
    }
  }
}
_router = new WeakMap();
_routerState = new WeakMap();
_position = new WeakMap();
_initialIsOpen = new WeakMap();
_shadowDOMTarget = new WeakMap();
_panelProps = new WeakMap();
_closeButtonProps = new WeakMap();
_toggleButtonProps = new WeakMap();
_containerElement = new WeakMap();
_isMounted = new WeakMap();
_Component = new WeakMap();
_dispose = new WeakMap();
exports.TanStackRouterDevtoolsCore = TanStackRouterDevtoolsCore;
//# sourceMappingURL=TanStackRouterDevtoolsCore.cjs.map
