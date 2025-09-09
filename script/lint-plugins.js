import { ESLint } from "eslint"
import path from "path"

// List of plugin names you want to lint
const pluginsToLint = ["kubernetes_ng"]

const pluginGlobs = pluginsToLint.map((p) => path.join("plugins", p, "app/javascript", "**/*.{js,jsx,ts,tsx}"))

const eslint = new ESLint({ fix: false }) // automatically reads .eslintrc.json

;(async () => {
  const results = await eslint.lintFiles(pluginGlobs) // lint only these files
  const formatter = await eslint.loadFormatter("stylish")
  console.log(formatter.format(results))

  if (results.some((r) => r.errorCount > 0)) process.exit(1)
})()
