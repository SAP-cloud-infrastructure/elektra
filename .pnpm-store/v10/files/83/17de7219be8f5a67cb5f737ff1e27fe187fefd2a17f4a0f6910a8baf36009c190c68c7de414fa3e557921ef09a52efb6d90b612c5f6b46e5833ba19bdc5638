import { splitSetCookieString } from "cookie-es";
function headersInitToObject(headers) {
  const obj = {};
  const headersInstance = new Headers(headers);
  for (const [key, value] of headersInstance.entries()) {
    obj[key] = value;
  }
  return obj;
}
function toHeadersInstance(init) {
  if (init instanceof Headers) {
    return new Headers(init);
  } else if (Array.isArray(init)) {
    return new Headers(init);
  } else if (typeof init === "object") {
    return new Headers(init);
  } else {
    return new Headers();
  }
}
function mergeHeaders(...headers) {
  return headers.reduce((acc, header) => {
    const headersInstance = toHeadersInstance(header);
    for (const [key, value] of headersInstance.entries()) {
      if (key === "set-cookie") {
        const splitCookies = splitSetCookieString(value);
        splitCookies.forEach((cookie) => acc.append("set-cookie", cookie));
      } else {
        acc.set(key, value);
      }
    }
    return acc;
  }, new Headers());
}
export {
  headersInitToObject,
  mergeHeaders
};
//# sourceMappingURL=headers.js.map
