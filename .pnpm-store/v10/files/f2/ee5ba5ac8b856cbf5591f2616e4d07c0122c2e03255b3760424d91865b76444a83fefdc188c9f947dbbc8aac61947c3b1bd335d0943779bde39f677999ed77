import * as React from "react";
import { useRouter } from "./useRouter.js";
import { useMatch } from "./useMatch.js";
function useNavigate(_defaultOpts) {
  const { navigate, state } = useRouter();
  const matchIndex = useMatch({
    strict: false,
    select: (match) => match.index
  });
  return React.useCallback(
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
  const router = useRouter();
  const navigate = useNavigate();
  const previousPropsRef = React.useRef(null);
  React.useEffect(() => {
    if (previousPropsRef.current !== props) {
      navigate(props);
      previousPropsRef.current = props;
    }
  }, [router, props, navigate]);
  return null;
}
export {
  Navigate,
  useNavigate
};
//# sourceMappingURL=useNavigate.js.map
