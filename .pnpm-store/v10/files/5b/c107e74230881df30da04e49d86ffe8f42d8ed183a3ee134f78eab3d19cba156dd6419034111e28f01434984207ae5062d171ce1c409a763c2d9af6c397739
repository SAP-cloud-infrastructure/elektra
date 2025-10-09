import { pathToFileURL } from "node:url";
import { tsImport } from "tsx/esm/api";
async function loadConfigFile(filePath) {
  const fileURL = pathToFileURL(filePath).href;
  const loaded = await tsImport(fileURL, "./");
  return loaded;
}
export {
  loadConfigFile
};
//# sourceMappingURL=loadConfigFile.js.map
