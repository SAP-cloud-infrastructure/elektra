"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespaceDefault(React);
function useStableCallback(fn) {
  const fnRef = React__namespace.useRef(fn);
  fnRef.current = fn;
  const ref = React__namespace.useRef((...args) => fnRef.current(...args));
  return ref.current;
}
const useLayoutEffect = typeof window !== "undefined" ? React__namespace.useLayoutEffect : React__namespace.useEffect;
function usePrevious(value) {
  const ref = React__namespace.useRef({
    value,
    prev: null
  });
  const current = ref.current.value;
  if (value !== current) {
    ref.current = {
      value,
      prev: current
    };
  }
  return ref.current.prev;
}
function useIntersectionObserver(ref, callback, intersectionObserverOptions = {}, options = {}) {
  React__namespace.useEffect(() => {
    if (!ref.current || options.disabled || typeof IntersectionObserver !== "function") {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      callback(entry);
    }, intersectionObserverOptions);
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [callback, intersectionObserverOptions, options.disabled, ref]);
}
function useForwardedRef(ref) {
  const innerRef = React__namespace.useRef(null);
  React__namespace.useImperativeHandle(ref, () => innerRef.current, []);
  return innerRef;
}
exports.useForwardedRef = useForwardedRef;
exports.useIntersectionObserver = useIntersectionObserver;
exports.useLayoutEffect = useLayoutEffect;
exports.usePrevious = usePrevious;
exports.useStableCallback = useStableCallback;
//# sourceMappingURL=utils.cjs.map
