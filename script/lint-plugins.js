import { ESLint } from "eslint"
import path from "path"
import fs from "fs"

const pluginsToLint = ["kubernetes_ng"]

async function run() {
  let shouldFail = false

  for (const pluginName of pluginsToLint) {
    const pluginPath = path.join("plugins", pluginName, "app/javascript")
    const tsconfigPath = path.join("plugins", pluginName, "tsconfig.json")
    const eslintConfigPath = path.join("plugins", pluginName, ".eslintrc.js")

    const projectExists = fs.existsSync(tsconfigPath)
    const configExists = fs.existsSync(eslintConfigPath)

    const eslint = new ESLint({
      fix: false,
      overrideConfigFile: configExists ? eslintConfigPath : undefined,
      overrideConfig: projectExists
        ? {
            parserOptions: {
              project: tsconfigPath,
              tsconfigRootDir: path.resolve("."),
            },
          }
        : {},
    })

    const results = await eslint.lintFiles(path.join(pluginPath, "**/*.{js,jsx,ts,tsx}"))
    const formatter = await eslint.loadFormatter("stylish")
    console.log(`\nLint results for plugin: ${pluginName}\n`)
    console.log(formatter.format(results))

    // Fail if there are any errors OR warnings
    if (results.some((r) => r.errorCount > 0 || r.warningCount > 0)) {
      shouldFail = true
    }
  }

  if (shouldFail) process.exit(1) // exit with non-zero if any plugin has warnings or errors
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
