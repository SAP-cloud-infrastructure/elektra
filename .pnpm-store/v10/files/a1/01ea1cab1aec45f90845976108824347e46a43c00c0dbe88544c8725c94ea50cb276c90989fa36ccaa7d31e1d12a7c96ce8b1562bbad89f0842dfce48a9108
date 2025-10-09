"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const utils = require("./utils.cjs");
function retainSearchParams(keys) {
  return ({ search, next }) => {
    const result = next(search);
    if (keys === true) {
      return { ...search, ...result };
    }
    keys.forEach((key) => {
      if (!(key in result)) {
        result[key] = search[key];
      }
    });
    return result;
  };
}
function stripSearchParams(input) {
  return ({ search, next }) => {
    if (input === true) {
      return {};
    }
    const result = next(search);
    if (Array.isArray(input)) {
      input.forEach((key) => {
        delete result[key];
      });
    } else {
      Object.entries(input).forEach(
        ([key, value]) => {
          if (utils.deepEqual(result[key], value)) {
            delete result[key];
          }
        }
      );
    }
    return result;
  };
}
exports.retainSearchParams = retainSearchParams;
exports.stripSearchParams = stripSearchParams;
//# sourceMappingURL=searchMiddleware.cjs.map
