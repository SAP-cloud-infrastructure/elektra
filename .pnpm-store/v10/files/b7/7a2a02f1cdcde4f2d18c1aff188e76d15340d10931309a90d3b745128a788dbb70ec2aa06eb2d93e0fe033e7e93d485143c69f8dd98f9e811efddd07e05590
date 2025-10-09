import { createComponent, Dynamic, mergeProps, template, spread, insert, effect, className } from "solid-js/web";
import { clsx } from "clsx";
import { createSignal, createEffect, createMemo } from "solid-js";
import { DevtoolsOnCloseContext } from "./context.js";
import { useIsMounted } from "./utils.js";
import { BaseTanStackRouterDevtoolsPanel } from "./BaseTanStackRouterDevtoolsPanel.js";
import useLocalStorage from "./useLocalStorage.js";
import { TanStackLogo } from "./logo.js";
import { useStyles } from "./useStyles.js";
var _tmpl$ = /* @__PURE__ */ template(`<button type=button><div><div></div><div></div></div><div>-</div><div>TanStack Router`);
function FloatingTanStackRouterDevtools({
  initialIsOpen,
  panelProps = {},
  closeButtonProps = {},
  toggleButtonProps = {},
  position = "bottom-left",
  containerElement: Container = "footer",
  router,
  routerState,
  shadowDOMTarget
}) {
  const [rootEl, setRootEl] = createSignal();
  let panelRef = void 0;
  const [isOpen, setIsOpen] = useLocalStorage("tanstackRouterDevtoolsOpen", initialIsOpen);
  const [devtoolsHeight, setDevtoolsHeight] = useLocalStorage("tanstackRouterDevtoolsHeight", null);
  const [isResolvedOpen, setIsResolvedOpen] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const isMounted = useIsMounted();
  const styles = useStyles();
  const handleDragStart = (panelElement, startEvent) => {
    if (startEvent.button !== 0) return;
    setIsResizing(true);
    const dragInfo = {
      originalHeight: (panelElement == null ? void 0 : panelElement.getBoundingClientRect().height) ?? 0,
      pageY: startEvent.pageY
    };
    const run = (moveEvent) => {
      const delta = dragInfo.pageY - moveEvent.pageY;
      const newHeight = dragInfo.originalHeight + delta;
      setDevtoolsHeight(newHeight);
      if (newHeight < 70) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    const unsub = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", run);
      document.removeEventListener("mouseUp", unsub);
    };
    document.addEventListener("mousemove", run);
    document.addEventListener("mouseup", unsub);
  };
  isOpen() ?? false;
  createEffect(() => {
    setIsResolvedOpen(isOpen() ?? false);
  });
  createEffect(() => {
    var _a, _b, _c;
    if (isResolvedOpen()) {
      const previousValue = (_b = (_a = rootEl()) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.style.paddingBottom;
      const run = () => {
        var _a2;
        const containerHeight = panelRef.getBoundingClientRect().height;
        if ((_a2 = rootEl()) == null ? void 0 : _a2.parentElement) {
          setRootEl((prev) => {
            if (prev == null ? void 0 : prev.parentElement) {
              prev.parentElement.style.paddingBottom = `${containerHeight}px`;
            }
            return prev;
          });
        }
      };
      run();
      if (typeof window !== "undefined") {
        window.addEventListener("resize", run);
        return () => {
          var _a2;
          window.removeEventListener("resize", run);
          if (((_a2 = rootEl()) == null ? void 0 : _a2.parentElement) && typeof previousValue === "string") {
            setRootEl((prev) => {
              prev.parentElement.style.paddingBottom = previousValue;
              return prev;
            });
          }
        };
      }
    } else {
      if ((_c = rootEl()) == null ? void 0 : _c.parentElement) {
        setRootEl((prev) => {
          if (prev == null ? void 0 : prev.parentElement) {
            prev.parentElement.removeAttribute("style");
          }
          return prev;
        });
      }
    }
    return;
  });
  createEffect(() => {
    if (rootEl()) {
      const el = rootEl();
      const fontSize = getComputedStyle(el).fontSize;
      el == null ? void 0 : el.style.setProperty("--tsrd-font-size", fontSize);
    }
  });
  const {
    style: panelStyle = {},
    ...otherPanelProps
  } = panelProps;
  const {
    style: closeButtonStyle = {},
    onClick: onCloseClick,
    ...otherCloseButtonProps
  } = closeButtonProps;
  const {
    onClick: onToggleClick,
    class: toggleButtonClassName,
    ...otherToggleButtonProps
  } = toggleButtonProps;
  if (!isMounted()) return null;
  const resolvedHeight = createMemo(() => devtoolsHeight() ?? 500);
  const basePanelClass = createMemo(() => {
    return clsx(styles().devtoolsPanelContainer, styles().devtoolsPanelContainerVisibility(!!isOpen()), styles().devtoolsPanelContainerResizing(isResizing), styles().devtoolsPanelContainerAnimation(isResolvedOpen(), resolvedHeight() + 16));
  });
  const basePanelStyle = createMemo(() => {
    return {
      height: `${resolvedHeight()}px`,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      ...panelStyle || {}
    };
  });
  const buttonStyle = createMemo(() => {
    return clsx(styles().mainCloseBtn, styles().mainCloseBtnPosition(position), styles().mainCloseBtnAnimation(!!isOpen()), toggleButtonClassName);
  });
  return createComponent(Dynamic, {
    component: Container,
    ref: setRootEl,
    "class": "TanStackRouterDevtools",
    get children() {
      return [createComponent(DevtoolsOnCloseContext.Provider, {
        value: {
          onCloseClick: onCloseClick ?? (() => {
          })
        },
        get children() {
          return createComponent(BaseTanStackRouterDevtoolsPanel, mergeProps({
            ref(r$) {
              var _ref$ = panelRef;
              typeof _ref$ === "function" ? _ref$(r$) : panelRef = r$;
            }
          }, otherPanelProps, {
            router,
            routerState,
            className: basePanelClass,
            style: basePanelStyle,
            get isOpen() {
              return isResolvedOpen();
            },
            setIsOpen,
            handleDragStart: (e) => handleDragStart(panelRef, e),
            shadowDOMTarget
          }));
        }
      }), (() => {
        var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$2.nextSibling, _el$6 = _el$5.nextSibling;
        spread(_el$, mergeProps(otherToggleButtonProps, {
          "aria-label": "Open TanStack Router Devtools",
          "onClick": (e) => {
            setIsOpen(true);
            onToggleClick && onToggleClick(e);
          },
          get ["class"]() {
            return buttonStyle();
          }
        }), false, true);
        insert(_el$3, createComponent(TanStackLogo, {}));
        insert(_el$4, createComponent(TanStackLogo, {}));
        effect((_p$) => {
          var _v$ = styles().mainCloseBtnIconContainer, _v$2 = styles().mainCloseBtnIconOuter, _v$3 = styles().mainCloseBtnIconInner, _v$4 = styles().mainCloseBtnDivider, _v$5 = styles().routerLogoCloseButton;
          _v$ !== _p$.e && className(_el$2, _p$.e = _v$);
          _v$2 !== _p$.t && className(_el$3, _p$.t = _v$2);
          _v$3 !== _p$.a && className(_el$4, _p$.a = _v$3);
          _v$4 !== _p$.o && className(_el$5, _p$.o = _v$4);
          _v$5 !== _p$.i && className(_el$6, _p$.i = _v$5);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0
        });
        return _el$;
      })()];
    }
  });
}
export {
  FloatingTanStackRouterDevtools,
  FloatingTanStackRouterDevtools as default
};
//# sourceMappingURL=FloatingTanStackRouterDevtools.js.map
