const path = require("path")

const globalAppPath = path.resolve(__dirname, `../../`)

// resolves global paths
// paths = {"name": "global_path"}
// e.g. paths = {lib: "app/javascript/lib", core: "app/javascript/core"}
const pathsResolver = (paths = {}) => ({
  name: "path resolver",
  setup(build) {
    for (let name in paths) {
      const path = paths[name]
      const regex = new RegExp(`^${name}/`)

      build.onResolve({ filter: regex }, async (args) => {
        const result = await build.resolve(
          "./" + args.path.replace(name, path),
          {
            resolveDir: globalAppPath,
            kind: args.kind, 
          }
        )

        return { path: result.path }
      })
    }
  },
})

module.exports = pathsResolver
