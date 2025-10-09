"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const isMatch = (match, path) => {
  const parts = path.split(".");
  let part;
  let value = match;
  while ((part = parts.shift()) != null && value != null) {
    value = value[part];
  }
  return value != null;
};
exports.isMatch = isMatch;
//# sourceMappingURL=Matches.cjs.map
