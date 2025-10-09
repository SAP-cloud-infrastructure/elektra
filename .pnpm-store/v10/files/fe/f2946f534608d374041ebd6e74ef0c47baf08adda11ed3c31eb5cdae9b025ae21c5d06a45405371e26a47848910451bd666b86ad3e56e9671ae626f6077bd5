"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const web = require("solid-js/web");
const clsx = require("clsx");
const goober = require("goober");
const solidJs = require("solid-js");
const tokens = require("./tokens.cjs");
const utils = require("./utils.cjs");
const context = require("./context.cjs");
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
const goober__namespace = /* @__PURE__ */ _interopNamespaceDefault(goober);
var _tmpl$ = /* @__PURE__ */ web.template(`<span><svg xmlns=http://www.w3.org/2000/svg width=12 height=12 fill=none viewBox="0 0 24 24"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M9 18l6-6-6-6">`), _tmpl$2 = /* @__PURE__ */ web.template(`<div>`), _tmpl$3 = /* @__PURE__ */ web.template(`<button><span> `), _tmpl$4 = /* @__PURE__ */ web.template(`<div><div><button> [<!> ... <!>]`), _tmpl$5 = /* @__PURE__ */ web.template(`<button><span></span> 🔄 `), _tmpl$6 = /* @__PURE__ */ web.template(`<span>:`), _tmpl$7 = /* @__PURE__ */ web.template(`<span>`);
const Expander = ({
  expanded,
  style = {}
}) => {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild;
    web.effect((_p$) => {
      var _v$ = styles().expander, _v$2 = clsx.clsx(styles().expanderIcon(expanded));
      _v$ !== _p$.e && web.className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && web.setAttribute(_el$2, "class", _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
};
function chunkArray(array, size) {
  if (size < 1) return [];
  let i = 0;
  const result = [];
  while (i < array.length) {
    result.push(array.slice(i, i + size));
    i = i + size;
  }
  return result;
}
function isIterable(x) {
  return Symbol.iterator in x;
}
function Explorer({
  value,
  defaultExpanded,
  pageSize = 100,
  filterSubEntries,
  ...rest
}) {
  const [expanded, setExpanded] = solidJs.createSignal(Boolean(defaultExpanded));
  const toggleExpanded = () => setExpanded((old) => !old);
  const type = solidJs.createMemo(() => typeof value());
  const subEntries = solidJs.createMemo(() => {
    let entries = [];
    const makeProperty = (sub) => {
      const subDefaultExpanded = defaultExpanded === true ? {
        [sub.label]: true
      } : defaultExpanded == null ? void 0 : defaultExpanded[sub.label];
      return {
        ...sub,
        value: () => sub.value,
        defaultExpanded: subDefaultExpanded
      };
    };
    if (Array.isArray(value())) {
      entries = value().map((d, i) => makeProperty({
        label: i.toString(),
        value: d
      }));
    } else if (value() !== null && typeof value() === "object" && isIterable(value()) && typeof value()[Symbol.iterator] === "function") {
      entries = Array.from(value(), (val, i) => makeProperty({
        label: i.toString(),
        value: val
      }));
    } else if (typeof value() === "object" && value() !== null) {
      entries = Object.entries(value()).map(([key, val]) => makeProperty({
        label: key,
        value: val
      }));
    }
    return filterSubEntries ? filterSubEntries(entries) : entries;
  });
  const subEntryPages = solidJs.createMemo(() => chunkArray(subEntries(), pageSize));
  const [expandedPages, setExpandedPages] = solidJs.createSignal([]);
  const [valueSnapshot, setValueSnapshot] = solidJs.createSignal(void 0);
  const styles = useStyles();
  const refreshValueSnapshot = () => {
    setValueSnapshot(value()());
  };
  const handleEntry = (entry) => web.createComponent(Explorer, web.mergeProps({
    value,
    filterSubEntries
  }, rest, entry));
  return (() => {
    var _el$3 = _tmpl$2();
    web.insert(_el$3, (() => {
      var _c$ = web.memo(() => !!subEntryPages().length);
      return () => _c$() ? [(() => {
        var _el$4 = _tmpl$3(), _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild;
        _el$4.$$click = () => toggleExpanded();
        web.insert(_el$4, web.createComponent(Expander, {
          get expanded() {
            return expanded() ?? false;
          }
        }), _el$5);
        web.insert(_el$4, () => rest.label, _el$5);
        web.insert(_el$5, () => String(type).toLowerCase() === "iterable" ? "(Iterable) " : "", _el$6);
        web.insert(_el$5, () => subEntries().length, _el$6);
        web.insert(_el$5, () => subEntries().length > 1 ? `items` : `item`, null);
        web.effect((_p$) => {
          var _v$3 = styles().expandButton, _v$4 = styles().info;
          _v$3 !== _p$.e && web.className(_el$4, _p$.e = _v$3);
          _v$4 !== _p$.t && web.className(_el$5, _p$.t = _v$4);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$4;
      })(), web.memo(() => web.memo(() => !!(expanded() ?? false))() ? web.memo(() => subEntryPages().length === 1)() ? (() => {
        var _el$7 = _tmpl$2();
        web.insert(_el$7, () => subEntries().map((entry, index) => handleEntry(entry)));
        web.effect(() => web.className(_el$7, styles().subEntries));
        return _el$7;
      })() : (() => {
        var _el$8 = _tmpl$2();
        web.insert(_el$8, () => subEntryPages().map((entries, index) => {
          return (() => {
            var _el$9 = _tmpl$4(), _el$0 = _el$9.firstChild, _el$1 = _el$0.firstChild, _el$10 = _el$1.firstChild, _el$15 = _el$10.nextSibling, _el$12 = _el$15.nextSibling, _el$16 = _el$12.nextSibling;
            _el$16.nextSibling;
            _el$1.$$click = () => setExpandedPages((old) => old.includes(index) ? old.filter((d) => d !== index) : [...old, index]);
            web.insert(_el$1, web.createComponent(Expander, {
              get expanded() {
                return expandedPages().includes(index);
              }
            }), _el$10);
            web.insert(_el$1, index * pageSize, _el$15);
            web.insert(_el$1, index * pageSize + pageSize - 1, _el$16);
            web.insert(_el$0, (() => {
              var _c$3 = web.memo(() => !!expandedPages().includes(index));
              return () => _c$3() ? (() => {
                var _el$17 = _tmpl$2();
                web.insert(_el$17, () => entries.map((entry) => handleEntry(entry)));
                web.effect(() => web.className(_el$17, styles().subEntries));
                return _el$17;
              })() : null;
            })(), null);
            web.effect((_p$) => {
              var _v$5 = styles().entry, _v$6 = clsx.clsx(styles().labelButton, "labelButton");
              _v$5 !== _p$.e && web.className(_el$0, _p$.e = _v$5);
              _v$6 !== _p$.t && web.className(_el$1, _p$.t = _v$6);
              return _p$;
            }, {
              e: void 0,
              t: void 0
            });
            return _el$9;
          })();
        }));
        web.effect(() => web.className(_el$8, styles().subEntries));
        return _el$8;
      })() : null)] : (() => {
        var _c$2 = web.memo(() => type() === "function");
        return () => _c$2() ? web.createComponent(Explorer, {
          get label() {
            return (() => {
              var _el$18 = _tmpl$5(), _el$19 = _el$18.firstChild;
              _el$18.$$click = refreshValueSnapshot;
              web.insert(_el$19, () => rest.label);
              web.effect(() => web.className(_el$18, styles().refreshValueBtn));
              return _el$18;
            })();
          },
          value: valueSnapshot,
          defaultExpanded: {}
        }) : [(() => {
          var _el$20 = _tmpl$6(), _el$21 = _el$20.firstChild;
          web.insert(_el$20, () => rest.label, _el$21);
          return _el$20;
        })(), " ", (() => {
          var _el$22 = _tmpl$7();
          web.insert(_el$22, () => utils.displayValue(value()));
          web.effect(() => web.className(_el$22, styles().value));
          return _el$22;
        })()];
      })();
    })());
    web.effect(() => web.className(_el$3, styles().entry));
    return _el$3;
  })();
}
const stylesFactory = (shadowDOMTarget) => {
  const {
    colors,
    font,
    size
  } = tokens.tokens;
  const {
    fontFamily,
    lineHeight,
    size: fontSize
  } = font;
  const css = shadowDOMTarget ? goober__namespace.css.bind({
    target: shadowDOMTarget
  }) : goober__namespace.css;
  return {
    entry: css`
      font-family: ${fontFamily.mono};
      font-size: ${fontSize.xs};
      line-height: ${lineHeight.sm};
      outline: none;
      word-break: break-word;
    `,
    labelButton: css`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,
    expander: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size[3]};
      height: ${size[3]};
      padding-left: 3px;
      box-sizing: content-box;
    `,
    expanderIcon: (expanded) => {
      if (expanded) {
        return css`
          transform: rotate(90deg);
          transition: transform 0.1s ease;
        `;
      }
      return css`
        transform: rotate(0deg);
        transition: transform 0.1s ease;
      `;
    },
    expandButton: css`
      display: flex;
      gap: ${size[1]};
      align-items: center;
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,
    value: css`
      color: ${colors.purple[400]};
    `,
    subEntries: css`
      margin-left: ${size[2]};
      padding-left: ${size[2]};
      border-left: 2px solid ${colors.darkGray[400]};
    `,
    info: css`
      color: ${colors.gray[500]};
      font-size: ${fontSize["2xs"]};
      padding-left: ${size[1]};
    `,
    refreshValueBtn: css`
      appearance: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: inherit;
      padding: 0;
      font-family: ${fontFamily.mono};
      font-size: ${fontSize.xs};
    `
  };
};
function useStyles() {
  const shadowDomTarget = solidJs.useContext(context.ShadowDomTargetContext);
  const [_styles] = solidJs.createSignal(stylesFactory(shadowDomTarget));
  return _styles;
}
web.delegateEvents(["click"]);
exports.Expander = Expander;
exports.Explorer = Explorer;
exports.chunkArray = chunkArray;
//# sourceMappingURL=Explorer.cjs.map
