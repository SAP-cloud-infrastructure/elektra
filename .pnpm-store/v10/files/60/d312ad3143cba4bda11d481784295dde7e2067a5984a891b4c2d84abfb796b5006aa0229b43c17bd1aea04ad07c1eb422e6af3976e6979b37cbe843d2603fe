"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_url = require("node:url");
const api = require("tsx/esm/api");
async function loadConfigFile(filePath) {
  const fileURL = node_url.pathToFileURL(filePath).href;
  const loaded = await api.tsImport(fileURL, "./");
  return loaded;
}
exports.loadConfigFile = loadConfigFile;
//# sourceMappingURL=loadConfigFile.cjs.map
