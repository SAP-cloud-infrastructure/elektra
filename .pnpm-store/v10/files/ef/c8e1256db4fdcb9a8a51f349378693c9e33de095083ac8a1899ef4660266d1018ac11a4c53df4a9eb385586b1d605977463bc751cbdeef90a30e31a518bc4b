import ansis from "ansis";
import { diffWords } from "diff";
function logDiff(oldStr, newStr) {
  const differences = diffWords(oldStr, newStr);
  let output = "";
  let unchangedLines = "";
  function processUnchangedLines(lines) {
    const lineArray = lines.split("\n");
    if (lineArray.length > 4) {
      return [
        ansis.dim(lineArray[0]),
        ansis.dim(lineArray[1]),
        "",
        ansis.dim.bold(`... (${lineArray.length - 4} lines) ...`),
        "",
        ansis.dim(lineArray[lineArray.length - 2]),
        ansis.dim(lineArray[lineArray.length - 1])
      ].join("\n");
    }
    return ansis.dim(lines);
  }
  differences.forEach((part, index) => {
    const nextPart = differences[index + 1];
    if (part.added) {
      if (unchangedLines) {
        output += processUnchangedLines(unchangedLines);
        unchangedLines = "";
      }
      output += ansis.green.bold(part.value);
      if (nextPart == null ? void 0 : nextPart.removed) output += " ";
    } else if (part.removed) {
      if (unchangedLines) {
        output += processUnchangedLines(unchangedLines);
        unchangedLines = "";
      }
      output += ansis.red.bold(part.value);
      if (nextPart == null ? void 0 : nextPart.added) output += " ";
    } else {
      unchangedLines += part.value;
    }
  });
  if (unchangedLines) {
    output += processUnchangedLines(unchangedLines);
  }
  if (output) {
    console.log("\nDiff:");
    console.log(output + "\n\n");
  } else {
    console.log("No changes");
  }
}
export {
  logDiff
};
//# sourceMappingURL=logger.js.map
