"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const useRouter = require("./useRouter.cjs");
const useMatch = require("./useMatch.cjs");
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
function useNavigate(_defaultOpts) {
  const { navigate, state } = useRouter.useRouter();
  const matchIndex = useMatch.useMatch({
    strict: false,
    select: (match) => match.index
  });
  return React__namespace.useCallback(
    (options) => {
      const from = options.from ?? (_defaultOpts == null ? void 0 : _defaultOpts.from) ?? state.matches[matchIndex].fullPath;
      return navigate({
        ...options,
        from
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_defaultOpts == null ? void 0 : _defaultOpts.from, navigate]
  );
}
function Navigate(props) {
  const router = useRouter.useRouter();
  const navigate = useNavigate();
  const previousPropsRef = React__namespace.useRef(null);
  React__namespace.useEffect(() => {
    if (previousPropsRef.current !== props) {
      navigate(props);
      previousPropsRef.current = props;
    }
  }, [router, props, navigate]);
  return null;
}
exports.Navigate = Navigate;
exports.useNavigate = useNavigate;
//# sourceMappingURL=useNavigate.cjs.map
