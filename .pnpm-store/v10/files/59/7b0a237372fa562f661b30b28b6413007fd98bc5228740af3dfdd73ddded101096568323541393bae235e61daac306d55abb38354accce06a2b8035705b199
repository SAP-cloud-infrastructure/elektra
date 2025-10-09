"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function encode(obj, pfx) {
  const normalizedObject = Object.entries(obj).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((v) => [key, String(v)]);
    } else {
      return [[key, String(value)]];
    }
  });
  const searchParams = new URLSearchParams(normalizedObject);
  return (pfx || "") + searchParams.toString();
}
function toValue(str) {
  if (!str) return "";
  if (str === "false") return false;
  if (str === "true") return true;
  return +str * 0 === 0 && +str + "" === str ? +str : str;
}
function decode(str, pfx) {
  const searchParamsPart = pfx ? str.slice(pfx.length) : str;
  const searchParams = new URLSearchParams(searchParamsPart);
  const entries = [...searchParams.entries()];
  return entries.reduce((acc, [key, value]) => {
    const previousValue = acc[key];
    if (previousValue == null) {
      acc[key] = toValue(value);
    } else {
      acc[key] = Array.isArray(previousValue) ? [...previousValue, toValue(value)] : [previousValue, toValue(value)];
    }
    return acc;
  }, {});
}
exports.decode = decode;
exports.encode = encode;
//# sourceMappingURL=qss.cjs.map
