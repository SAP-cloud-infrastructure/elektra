"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const web = require("solid-js/web");
const clsx = require("clsx");
const invariant = require("tiny-invariant");
const routerCore = require("@tanstack/router-core");
const solidJs = require("solid-js");
const context = require("./context.cjs");
const useStyles = require("./useStyles.cjs");
const useLocalStorage = require("./useLocalStorage.cjs");
const Explorer = require("./Explorer.cjs");
const utils = require("./utils.cjs");
const AgeTicker = require("./AgeTicker.cjs");
const NavigateButton = require("./NavigateButton.cjs");
var _tmpl$ = /* @__PURE__ */ web.template(`<button><div>TANSTACK</div><div>TanStack Router v1`), _tmpl$2 = /* @__PURE__ */ web.template(`<div><div>`), _tmpl$3 = /* @__PURE__ */ web.template(`<code> `), _tmpl$4 = /* @__PURE__ */ web.template(`<code>`), _tmpl$5 = /* @__PURE__ */ web.template(`<div><div role=button><div>`), _tmpl$6 = /* @__PURE__ */ web.template(`<div>`), _tmpl$7 = /* @__PURE__ */ web.template(`<div><button><svg xmlns=http://www.w3.org/2000/svg width=10 height=6 fill=none viewBox="0 0 10 6"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=1.667 d="M1 1l4 4 4-4"></path></svg></button><div><div></div><div><div></div></div></div><div><div><div><span>Pathname</span></div><div><code></code></div><div><div><button type=button>Routes</button><button type=button>Matches</button></div><div><div>age / staleTime / gcTime</div></div></div><div>`), _tmpl$8 = /* @__PURE__ */ web.template(`<div><span>masked`), _tmpl$9 = /* @__PURE__ */ web.template(`<div role=button><div>`), _tmpl$0 = /* @__PURE__ */ web.template(`<div><div><div>Cached Matches</div><div>age / staleTime / gcTime</div></div><div>`), _tmpl$1 = /* @__PURE__ */ web.template(`<div><div>Match Details</div><div><div><div><div></div></div><div><div>ID:</div><div><code></code></div></div><div><div>State:</div><div></div></div><div><div>Last Updated:</div><div></div></div></div></div><div>Explorer</div><div>`), _tmpl$10 = /* @__PURE__ */ web.template(`<div>Loader Data`), _tmpl$11 = /* @__PURE__ */ web.template(`<div><div>Search Params</div><div>`);
function Logo(props) {
  const {
    className,
    ...rest
  } = props;
  const styles = useStyles.useStyles();
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
    web.spread(_el$, web.mergeProps(rest, {
      get ["class"]() {
        return clsx.clsx(styles().logo, className ? className() : "");
      }
    }), false, true);
    web.effect((_p$) => {
      var _v$ = styles().tanstackLogo, _v$2 = styles().routerLogo;
      _v$ !== _p$.e && web.className(_el$2, _p$.e = _v$);
      _v$2 !== _p$.t && web.className(_el$3, _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
}
function NavigateLink(props) {
  return (() => {
    var _el$4 = _tmpl$2(), _el$5 = _el$4.firstChild;
    _el$4.style.setProperty("display", "flex");
    _el$4.style.setProperty("align-items", "center");
    _el$4.style.setProperty("width", "100%");
    web.insert(_el$4, () => props.left, _el$5);
    _el$5.style.setProperty("flex-grow", "1");
    _el$5.style.setProperty("min-width", "0");
    web.insert(_el$5, () => props.children);
    web.insert(_el$4, () => props.right, null);
    web.effect(() => web.className(_el$4, props.class));
    return _el$4;
  })();
}
function RouteComp({
  routerState,
  router,
  route,
  isRoot,
  activeId,
  setActiveId
}) {
  const styles = useStyles.useStyles();
  const matches = solidJs.createMemo(() => routerState().pendingMatches || routerState().matches);
  const match = solidJs.createMemo(() => routerState().matches.find((d) => d.routeId === route.id));
  const param = solidJs.createMemo(() => {
    var _a, _b;
    try {
      if ((_a = match()) == null ? void 0 : _a.params) {
        const p = (_b = match()) == null ? void 0 : _b.params;
        const r = route.path || routerCore.trimPath(route.id);
        if (r.startsWith("$")) {
          const trimmed = r.slice(1);
          if (p[trimmed]) {
            return `(${p[trimmed]})`;
          }
        }
      }
      return "";
    } catch (error) {
      return "";
    }
  });
  const navigationTarget = solidJs.createMemo(() => {
    if (isRoot) return void 0;
    if (!route.path) return void 0;
    const allParams = Object.assign({}, ...matches().map((m) => m.params));
    const interpolated = routerCore.interpolatePath({
      path: route.fullPath,
      params: allParams,
      leaveWildcards: false,
      leaveParams: false,
      decodeCharMap: router().pathParamsDecodeCharMap
    });
    return !interpolated.isMissingParams ? interpolated.interpolatedPath : void 0;
  });
  return (() => {
    var _el$6 = _tmpl$5(), _el$7 = _el$6.firstChild, _el$8 = _el$7.firstChild;
    _el$7.$$click = () => {
      if (match()) {
        setActiveId(activeId() === route.id ? "" : route.id);
      }
    };
    web.insert(_el$7, web.createComponent(NavigateLink, {
      get ["class"]() {
        return clsx.clsx(styles().routesRow(!!match()));
      },
      get left() {
        return web.createComponent(solidJs.Show, {
          get when() {
            return navigationTarget();
          },
          children: (navigate) => web.createComponent(NavigateButton.NavigateButton, {
            get to() {
              return navigate();
            },
            router
          })
        });
      },
      get right() {
        return web.createComponent(AgeTicker.AgeTicker, {
          get match() {
            return match();
          },
          router
        });
      },
      get children() {
        return [(() => {
          var _el$9 = _tmpl$3(), _el$0 = _el$9.firstChild;
          web.insert(_el$9, () => isRoot ? routerCore.rootRouteId : route.path || routerCore.trimPath(route.id), _el$0);
          web.effect(() => web.className(_el$9, styles().code));
          return _el$9;
        })(), (() => {
          var _el$1 = _tmpl$4();
          web.insert(_el$1, param);
          web.effect(() => web.className(_el$1, styles().routeParamInfo));
          return _el$1;
        })()];
      }
    }), null);
    web.insert(_el$6, (() => {
      var _c$ = web.memo(() => {
        var _a;
        return !!((_a = route.children) == null ? void 0 : _a.length);
      });
      return () => _c$() ? (() => {
        var _el$10 = _tmpl$6();
        web.insert(_el$10, () => [...route.children].sort((a, b) => {
          return a.rank - b.rank;
        }).map((r) => web.createComponent(RouteComp, {
          routerState,
          router,
          route: r,
          activeId,
          setActiveId
        })));
        web.effect(() => web.className(_el$10, styles().nestedRouteRow(!!isRoot)));
        return _el$10;
      })() : null;
    })(), null);
    web.effect((_p$) => {
      var _v$3 = `Open match details for ${route.id}`, _v$4 = clsx.clsx(styles().routesRowContainer(route.id === activeId(), !!match())), _v$5 = clsx.clsx(styles().matchIndicator(utils.getRouteStatusColor(matches(), route)));
      _v$3 !== _p$.e && web.setAttribute(_el$7, "aria-label", _p$.e = _v$3);
      _v$4 !== _p$.t && web.className(_el$7, _p$.t = _v$4);
      _v$5 !== _p$.a && web.className(_el$8, _p$.a = _v$5);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$6;
  })();
}
const BaseTanStackRouterDevtoolsPanel = function BaseTanStackRouterDevtoolsPanel2({
  ...props
}) {
  const {
    isOpen = true,
    setIsOpen,
    handleDragStart,
    router,
    routerState,
    shadowDOMTarget,
    ...panelProps
  } = props;
  const {
    onCloseClick
  } = context.useDevtoolsOnClose();
  const styles = useStyles.useStyles();
  const {
    className,
    style,
    ...otherPanelProps
  } = panelProps;
  invariant(router, "No router was found for the TanStack Router Devtools. Please place the devtools in the <RouterProvider> component tree or pass the router instance to the devtools manually.");
  const [showMatches, setShowMatches] = useLocalStorage("tanstackRouterDevtoolsShowMatches", true);
  const [activeId, setActiveId] = useLocalStorage("tanstackRouterDevtoolsActiveRouteId", "");
  const activeMatch = solidJs.createMemo(() => {
    const matches = [...routerState().pendingMatches ?? [], ...routerState().matches, ...routerState().cachedMatches];
    return matches.find((d) => d.routeId === activeId() || d.id === activeId());
  });
  const hasSearch = solidJs.createMemo(() => Object.keys(routerState().location.search).length);
  const explorerState = solidJs.createMemo(() => {
    return {
      ...router(),
      state: routerState()
    };
  });
  const routerExplorerValue = solidJs.createMemo(() => Object.fromEntries(utils.multiSortBy(Object.keys(explorerState()), ["state", "routesById", "routesByPath", "flatRoutes", "options", "manifest"].map((d) => (dd) => dd !== d)).map((key) => [key, explorerState()[key]]).filter((d) => typeof d[1] !== "function" && !["__store", "basepath", "injectedHtml", "subscribers", "latestLoadPromise", "navigateTimeout", "resetNextScroll", "tempLocationKey", "latestLocation", "routeTree", "history"].includes(d[0]))));
  const activeMatchLoaderData = solidJs.createMemo(() => {
    var _a;
    return (_a = activeMatch()) == null ? void 0 : _a.loaderData;
  });
  const activeMatchValue = solidJs.createMemo(() => activeMatch());
  const locationSearchValue = solidJs.createMemo(() => routerState().location.search);
  return (() => {
    var _el$11 = _tmpl$7(), _el$12 = _el$11.firstChild, _el$13 = _el$12.firstChild, _el$14 = _el$12.nextSibling, _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling, _el$17 = _el$16.firstChild, _el$18 = _el$14.nextSibling, _el$19 = _el$18.firstChild, _el$20 = _el$19.firstChild;
    _el$20.firstChild;
    var _el$22 = _el$20.nextSibling, _el$23 = _el$22.firstChild, _el$24 = _el$22.nextSibling, _el$25 = _el$24.firstChild, _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling, _el$28 = _el$25.nextSibling, _el$29 = _el$24.nextSibling;
    web.spread(_el$11, web.mergeProps({
      get ["class"]() {
        return clsx.clsx(styles().devtoolsPanel, "TanStackRouterDevtoolsPanel", className ? className() : "");
      },
      get style() {
        return style ? style() : "";
      }
    }, otherPanelProps), false, true);
    web.insert(_el$11, handleDragStart ? (() => {
      var _el$30 = _tmpl$6();
      web.addEventListener(_el$30, "mousedown", handleDragStart, true);
      web.effect(() => web.className(_el$30, styles().dragHandle));
      return _el$30;
    })() : null, _el$12);
    _el$12.$$click = (e) => {
      if (setIsOpen) {
        setIsOpen(false);
      }
      onCloseClick(e);
    };
    web.insert(_el$15, web.createComponent(Logo, {
      "aria-hidden": true,
      onClick: (e) => {
        if (setIsOpen) {
          setIsOpen(false);
        }
        onCloseClick(e);
      }
    }));
    web.insert(_el$17, web.createComponent(Explorer.Explorer, {
      label: "Router",
      value: routerExplorerValue,
      defaultExpanded: {
        state: {},
        context: {},
        options: {}
      },
      filterSubEntries: (subEntries) => {
        return subEntries.filter((d) => typeof d.value() !== "function");
      }
    }));
    web.insert(_el$20, (() => {
      var _c$2 = web.memo(() => !!routerState().location.maskedLocation);
      return () => _c$2() ? (() => {
        var _el$31 = _tmpl$8(), _el$32 = _el$31.firstChild;
        web.effect((_p$) => {
          var _v$22 = styles().maskedBadgeContainer, _v$23 = styles().maskedBadge;
          _v$22 !== _p$.e && web.className(_el$31, _p$.e = _v$22);
          _v$23 !== _p$.t && web.className(_el$32, _p$.t = _v$23);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$31;
      })() : null;
    })(), null);
    web.insert(_el$23, () => routerState().location.pathname);
    web.insert(_el$22, (() => {
      var _c$3 = web.memo(() => !!routerState().location.maskedLocation);
      return () => _c$3() ? (() => {
        var _el$33 = _tmpl$4();
        web.insert(_el$33, () => {
          var _a;
          return (_a = routerState().location.maskedLocation) == null ? void 0 : _a.pathname;
        });
        web.effect(() => web.className(_el$33, styles().maskedLocation));
        return _el$33;
      })() : null;
    })(), null);
    _el$26.$$click = () => {
      setShowMatches(false);
    };
    _el$27.$$click = () => {
      setShowMatches(true);
    };
    web.insert(_el$29, (() => {
      var _c$4 = web.memo(() => !!!showMatches());
      return () => _c$4() ? web.createComponent(RouteComp, {
        routerState,
        router,
        get route() {
          return router().routeTree;
        },
        isRoot: true,
        activeId,
        setActiveId
      }) : (() => {
        var _el$34 = _tmpl$6();
        web.insert(_el$34, () => {
          var _a, _b;
          return (_b = ((_a = routerState().pendingMatches) == null ? void 0 : _a.length) ? routerState().pendingMatches : routerState().matches) == null ? void 0 : _b.map((match, _i) => {
            return (() => {
              var _el$35 = _tmpl$9(), _el$36 = _el$35.firstChild;
              _el$35.$$click = () => setActiveId(activeId() === match.id ? "" : match.id);
              web.insert(_el$35, web.createComponent(NavigateLink, {
                get left() {
                  return web.createComponent(NavigateButton.NavigateButton, {
                    get to() {
                      return match.pathname;
                    },
                    get params() {
                      return match.params;
                    },
                    get search() {
                      return match.search;
                    },
                    router
                  });
                },
                get right() {
                  return web.createComponent(AgeTicker.AgeTicker, {
                    match,
                    router
                  });
                },
                get children() {
                  var _el$37 = _tmpl$4();
                  web.insert(_el$37, () => `${match.routeId === routerCore.rootRouteId ? routerCore.rootRouteId : match.pathname}`);
                  web.effect(() => web.className(_el$37, styles().matchID));
                  return _el$37;
                }
              }), null);
              web.effect((_p$) => {
                var _v$24 = `Open match details for ${match.id}`, _v$25 = clsx.clsx(styles().matchRow(match === activeMatch())), _v$26 = clsx.clsx(styles().matchIndicator(utils.getStatusColor(match)));
                _v$24 !== _p$.e && web.setAttribute(_el$35, "aria-label", _p$.e = _v$24);
                _v$25 !== _p$.t && web.className(_el$35, _p$.t = _v$25);
                _v$26 !== _p$.a && web.className(_el$36, _p$.a = _v$26);
                return _p$;
              }, {
                e: void 0,
                t: void 0,
                a: void 0
              });
              return _el$35;
            })();
          });
        });
        return _el$34;
      })();
    })());
    web.insert(_el$18, (() => {
      var _c$5 = web.memo(() => !!routerState().cachedMatches.length);
      return () => _c$5() ? (() => {
        var _el$38 = _tmpl$0(), _el$39 = _el$38.firstChild, _el$40 = _el$39.firstChild, _el$41 = _el$40.nextSibling, _el$42 = _el$39.nextSibling;
        web.insert(_el$42, () => routerState().cachedMatches.map((match) => {
          return (() => {
            var _el$43 = _tmpl$9(), _el$44 = _el$43.firstChild;
            _el$43.$$click = () => setActiveId(activeId() === match.id ? "" : match.id);
            web.insert(_el$43, web.createComponent(NavigateLink, {
              get left() {
                return web.createComponent(NavigateButton.NavigateButton, {
                  get to() {
                    return match.pathname;
                  },
                  get params() {
                    return match.params;
                  },
                  get search() {
                    return match.search;
                  },
                  router
                });
              },
              get right() {
                return web.createComponent(AgeTicker.AgeTicker, {
                  match,
                  router
                });
              },
              get children() {
                var _el$45 = _tmpl$4();
                web.insert(_el$45, () => `${match.id}`);
                web.effect(() => web.className(_el$45, styles().matchID));
                return _el$45;
              }
            }), null);
            web.effect((_p$) => {
              var _v$30 = `Open match details for ${match.id}`, _v$31 = clsx.clsx(styles().matchRow(match === activeMatch())), _v$32 = clsx.clsx(styles().matchIndicator(utils.getStatusColor(match)));
              _v$30 !== _p$.e && web.setAttribute(_el$43, "aria-label", _p$.e = _v$30);
              _v$31 !== _p$.t && web.className(_el$43, _p$.t = _v$31);
              _v$32 !== _p$.a && web.className(_el$44, _p$.a = _v$32);
              return _p$;
            }, {
              e: void 0,
              t: void 0,
              a: void 0
            });
            return _el$43;
          })();
        }));
        web.effect((_p$) => {
          var _v$27 = styles().cachedMatchesContainer, _v$28 = styles().detailsHeader, _v$29 = styles().detailsHeaderInfo;
          _v$27 !== _p$.e && web.className(_el$38, _p$.e = _v$27);
          _v$28 !== _p$.t && web.className(_el$39, _p$.t = _v$28);
          _v$29 !== _p$.a && web.className(_el$41, _p$.a = _v$29);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$38;
      })() : null;
    })(), null);
    web.insert(_el$11, (() => {
      var _c$6 = web.memo(() => {
        var _a;
        return !!(activeMatch() && ((_a = activeMatch()) == null ? void 0 : _a.status));
      });
      return () => _c$6() ? (() => {
        var _el$46 = _tmpl$1(), _el$47 = _el$46.firstChild, _el$48 = _el$47.nextSibling, _el$49 = _el$48.firstChild, _el$50 = _el$49.firstChild, _el$51 = _el$50.firstChild, _el$52 = _el$50.nextSibling, _el$53 = _el$52.firstChild, _el$54 = _el$53.nextSibling, _el$55 = _el$54.firstChild, _el$56 = _el$52.nextSibling, _el$57 = _el$56.firstChild, _el$58 = _el$57.nextSibling, _el$59 = _el$56.nextSibling, _el$60 = _el$59.firstChild, _el$61 = _el$60.nextSibling, _el$62 = _el$48.nextSibling, _el$63 = _el$62.nextSibling;
        web.insert(_el$51, (() => {
          var _c$8 = web.memo(() => {
            var _a, _b;
            return !!(((_a = activeMatch()) == null ? void 0 : _a.status) === "success" && ((_b = activeMatch()) == null ? void 0 : _b.isFetching));
          });
          return () => {
            var _a;
            return _c$8() ? "fetching" : (_a = activeMatch()) == null ? void 0 : _a.status;
          };
        })());
        web.insert(_el$55, () => {
          var _a;
          return (_a = activeMatch()) == null ? void 0 : _a.id;
        });
        web.insert(_el$58, (() => {
          var _c$9 = web.memo(() => {
            var _a;
            return !!((_a = routerState().pendingMatches) == null ? void 0 : _a.find((d) => {
              var _a2;
              return d.id === ((_a2 = activeMatch()) == null ? void 0 : _a2.id);
            }));
          });
          return () => _c$9() ? "Pending" : routerState().matches.find((d) => {
            var _a;
            return d.id === ((_a = activeMatch()) == null ? void 0 : _a.id);
          }) ? "Active" : "Cached";
        })());
        web.insert(_el$61, (() => {
          var _c$0 = web.memo(() => {
            var _a;
            return !!((_a = activeMatch()) == null ? void 0 : _a.updatedAt);
          });
          return () => {
            var _a;
            return _c$0() ? new Date((_a = activeMatch()) == null ? void 0 : _a.updatedAt).toLocaleTimeString() : "N/A";
          };
        })());
        web.insert(_el$46, (() => {
          var _c$1 = web.memo(() => !!activeMatchLoaderData());
          return () => _c$1() ? [(() => {
            var _el$64 = _tmpl$10();
            web.effect(() => web.className(_el$64, styles().detailsHeader));
            return _el$64;
          })(), (() => {
            var _el$65 = _tmpl$6();
            web.insert(_el$65, web.createComponent(Explorer.Explorer, {
              label: "loaderData",
              value: activeMatchLoaderData,
              defaultExpanded: {}
            }));
            web.effect(() => web.className(_el$65, styles().detailsContent));
            return _el$65;
          })()] : null;
        })(), _el$62);
        web.insert(_el$63, web.createComponent(Explorer.Explorer, {
          label: "Match",
          value: activeMatchValue,
          defaultExpanded: {}
        }));
        web.effect((_p$) => {
          var _a, _b;
          var _v$33 = styles().thirdContainer, _v$34 = styles().detailsHeader, _v$35 = styles().matchDetails, _v$36 = styles().matchStatus((_a = activeMatch()) == null ? void 0 : _a.status, (_b = activeMatch()) == null ? void 0 : _b.isFetching), _v$37 = styles().matchDetailsInfoLabel, _v$38 = styles().matchDetailsInfo, _v$39 = styles().matchDetailsInfoLabel, _v$40 = styles().matchDetailsInfo, _v$41 = styles().matchDetailsInfoLabel, _v$42 = styles().matchDetailsInfo, _v$43 = styles().detailsHeader, _v$44 = styles().detailsContent;
          _v$33 !== _p$.e && web.className(_el$46, _p$.e = _v$33);
          _v$34 !== _p$.t && web.className(_el$47, _p$.t = _v$34);
          _v$35 !== _p$.a && web.className(_el$49, _p$.a = _v$35);
          _v$36 !== _p$.o && web.className(_el$50, _p$.o = _v$36);
          _v$37 !== _p$.i && web.className(_el$52, _p$.i = _v$37);
          _v$38 !== _p$.n && web.className(_el$54, _p$.n = _v$38);
          _v$39 !== _p$.s && web.className(_el$56, _p$.s = _v$39);
          _v$40 !== _p$.h && web.className(_el$58, _p$.h = _v$40);
          _v$41 !== _p$.r && web.className(_el$59, _p$.r = _v$41);
          _v$42 !== _p$.d && web.className(_el$61, _p$.d = _v$42);
          _v$43 !== _p$.l && web.className(_el$62, _p$.l = _v$43);
          _v$44 !== _p$.u && web.className(_el$63, _p$.u = _v$44);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0,
          n: void 0,
          s: void 0,
          h: void 0,
          r: void 0,
          d: void 0,
          l: void 0,
          u: void 0
        });
        return _el$46;
      })() : null;
    })(), null);
    web.insert(_el$11, (() => {
      var _c$7 = web.memo(() => !!hasSearch());
      return () => _c$7() ? (() => {
        var _el$66 = _tmpl$11(), _el$67 = _el$66.firstChild, _el$68 = _el$67.nextSibling;
        web.insert(_el$68, web.createComponent(Explorer.Explorer, {
          value: locationSearchValue,
          get defaultExpanded() {
            return Object.keys(routerState().location.search).reduce((obj, next) => {
              obj[next] = {};
              return obj;
            }, {});
          }
        }));
        web.effect((_p$) => {
          var _v$45 = styles().fourthContainer, _v$46 = styles().detailsHeader, _v$47 = styles().detailsContent;
          _v$45 !== _p$.e && web.className(_el$66, _p$.e = _v$45);
          _v$46 !== _p$.t && web.className(_el$67, _p$.t = _v$46);
          _v$47 !== _p$.a && web.className(_el$68, _p$.a = _v$47);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$66;
      })() : null;
    })(), null);
    web.effect((_p$) => {
      var _v$6 = styles().panelCloseBtn, _v$7 = styles().panelCloseBtnIcon, _v$8 = styles().firstContainer, _v$9 = styles().row, _v$0 = styles().routerExplorerContainer, _v$1 = styles().routerExplorer, _v$10 = styles().secondContainer, _v$11 = styles().matchesContainer, _v$12 = styles().detailsHeader, _v$13 = styles().detailsContent, _v$14 = styles().detailsHeader, _v$15 = styles().routeMatchesToggle, _v$16 = !showMatches(), _v$17 = clsx.clsx(styles().routeMatchesToggleBtn(!showMatches(), true)), _v$18 = showMatches(), _v$19 = clsx.clsx(styles().routeMatchesToggleBtn(!!showMatches(), false)), _v$20 = styles().detailsHeaderInfo, _v$21 = clsx.clsx(styles().routesContainer);
      _v$6 !== _p$.e && web.className(_el$12, _p$.e = _v$6);
      _v$7 !== _p$.t && web.setAttribute(_el$13, "class", _p$.t = _v$7);
      _v$8 !== _p$.a && web.className(_el$14, _p$.a = _v$8);
      _v$9 !== _p$.o && web.className(_el$15, _p$.o = _v$9);
      _v$0 !== _p$.i && web.className(_el$16, _p$.i = _v$0);
      _v$1 !== _p$.n && web.className(_el$17, _p$.n = _v$1);
      _v$10 !== _p$.s && web.className(_el$18, _p$.s = _v$10);
      _v$11 !== _p$.h && web.className(_el$19, _p$.h = _v$11);
      _v$12 !== _p$.r && web.className(_el$20, _p$.r = _v$12);
      _v$13 !== _p$.d && web.className(_el$22, _p$.d = _v$13);
      _v$14 !== _p$.l && web.className(_el$24, _p$.l = _v$14);
      _v$15 !== _p$.u && web.className(_el$25, _p$.u = _v$15);
      _v$16 !== _p$.c && (_el$26.disabled = _p$.c = _v$16);
      _v$17 !== _p$.w && web.className(_el$26, _p$.w = _v$17);
      _v$18 !== _p$.m && (_el$27.disabled = _p$.m = _v$18);
      _v$19 !== _p$.f && web.className(_el$27, _p$.f = _v$19);
      _v$20 !== _p$.y && web.className(_el$28, _p$.y = _v$20);
      _v$21 !== _p$.g && web.className(_el$29, _p$.g = _v$21);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0,
      r: void 0,
      d: void 0,
      l: void 0,
      u: void 0,
      c: void 0,
      w: void 0,
      m: void 0,
      f: void 0,
      y: void 0,
      g: void 0
    });
    return _el$11;
  })();
};
web.delegateEvents(["click", "mousedown"]);
exports.BaseTanStackRouterDevtoolsPanel = BaseTanStackRouterDevtoolsPanel;
exports.default = BaseTanStackRouterDevtoolsPanel;
//# sourceMappingURL=BaseTanStackRouterDevtoolsPanel.cjs.map
