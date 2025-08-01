#!/usr/bin/env node
const pathsResolverPlugin = require("./paths_resolver_plugin")
const globImportPlugin = require("./glob_import_plugin")
const postcss = require("postcss")
const { transform } = require("@svgr/core")
const sass = require("sass")
const url = require("postcss-url")
const fs = require("fs")

// const envFilePlugin = require("esbuild-envfile-plugin")
const envFilePlugin = require("./esbuild-plugin-env")
const entryPoints = require("./entrypoints")

const esbuild = require("esbuild")
const { format } = require("path")
const args = process.argv.slice(2)
const watch = args.indexOf("--watch") >= 0
const production = args.indexOf("--production") >= 0 || process.env.RAILS_ENV === "production"
const log = console.log.bind(console)

const config = {
  entryPoints: entryPoints(
    [
      // all "*" are replaced with the path tokens and joined by "_"
      { path: "app/javascript/*.{js,jsx}" }, // all js and jsx files in app/javascript folder
      {
        path: "plugins/*/app/javascript/plugin.{js,jsx}",
        suffix: "plugin",
      }, // all plugin.js files in all plugins
      {
        path: "plugins/*/app/javascript/widgets/*/init.{js,jsx}",
        suffix: "widget",
      },
      {
        path: "app/javascript/widgets/*/init.{js,jsx}",
        suffix: "widget",
      },
    ],
    { log: true }
  ),
  bundle: true,
  platform: "browser",
  outdir: "app/assets/builds",
  plugins: [
    envFilePlugin,
    pathsResolverPlugin({
      // see also in jest.config.js
      lib: "app/javascript/lib",
      core: "app/javascript/core",
      plugins: "plugins",
      config: "config",
    }),
    globImportPlugin(),

    {
      name: "svg-loader",
      setup(build) {
        build.onLoad(
          // consider only .svg files
          { filter: /.\.(svg)$/, namespace: "file" },
          async (args) => {
            let contents = fs.readFileSync(args.path)
            // built-in loaders: js, jsx, ts, tsx, css, json, text, base64, dataurl, file, binary
            let loader = "text"
            if (args.suffix === "?url") {
              // as URL
              const maxSize = 10240 // 10Kb
              // use dataurl loader for small files and file loader for big files!
              loader = contents.length <= maxSize ? "dataurl" : "file"
            } else {
              // as react component
              // use react component loader (jsx)
              loader = "jsx"
              contents = await transform(contents, {
                plugins: ["@svgr/plugin-jsx"],
              })
            }

            return { contents, loader }
          }
        )
      },
    },

    {
      // custom plugin to handle css imports
      name: "inline-styles",
      setup(build) {
        build.onLoad(
          // consider only .scss and .css files
          {
            filter: /.*\.(css|scss)$/,
            namespace: "file",
          },
          async (args) => {
            let content
            // handle scss, convert to css
            if (args.path.endsWith(".scss")) {
              const result = sass.compile(args.path, {
                loadPaths: ["./node_modules"], // required for imported styles from node_modules
              }) //sass.renderSync({ file: args.path })
              content = result.css
            } else {
              // read file content
              content = await fs.readFileSync(args.path)
            }

            // postcss plugins
            const plugins = [
              require("tailwindcss"),
              require("autoprefixer"),
              // rewrite urls inside css
              url({
                url: "inline",
                maxSize: 10, // use dataurls if files are smaller than 10k
                fallback: "copy", // if files are bigger use copy method
                assetsPath: "./app/images",
                useHash: true,
                optimizeSvgEncode: true,
              }),
            ]
            // minify in production mode
            if (production) plugins.push(require("postcss-minify"))

            const { css } = await postcss(plugins).process(content, {
              from: args.path,
              to: "",
            })
            // built-in loaders: js, jsx, ts, tsx, css, json, text, base64, dataurl, file, binary
            return {
              contents: css,
              loader: args.suffix === "?inline" ? "text" : "copy", // as text if inline and copy file to builds otherwise
            }
          }
        )
      },
    },
  ],
  //loader: { ".js": "jsx" },
  target: ["es2020"],
  minify: production,
  sourcemap: !production,
  // map global this to window
  define: { this: "window" },
  allowOverwrite: true,
  loader: {
    // built-in loaders: js, jsx, ts, tsx, css, json, text, base64, dataurl, file, binary
    ".ttf": "file",
    ".otf": "file",
    ".eot": "file",
    ".woff": "file",
    ".woff2": "file",
    ".png": "dataurl",

    // Disable the loader as inline files are handled by sass plugin
    // ".inline.css": "text",
  },
}

const grey = "\x1b[30m%s\x1b[0m"
const red = "\x1b[31m%s\x1b[0m"
const green = "\x1b[32m%s\x1b[0m"
const yellow = "\x1b[33m%s\x1b[0m"
const blue = "\x1b[34m%s\x1b[0m"

function compile(options = {}) {
  if (options.clear) console.clear()
  if (options.change) {
    log(yellow, "◻️ Change detected -> compile")
  } else {
    log(yellow, "◻️ First compile...")
  }

  return esbuild
    .build(config)
    .then(() => {
      log(green, "◻️ Compile completed successfully with no errors! Don't worry Be Happy 🙂")
    })
    .catch((error) => {
      log(red, "Compile completed with error 😐")
      console.error(error)
      if (process.env.RAILS_ENV === "production") {
        // exit if we have an error on production build
        process.exit(1)
      }
    })
}

if (watch) {
  compile().then(() => {
    //******************************************** */
    const chokidar = require("chokidar")
    // Initialize watcher.
    const watcher = chokidar.watch(
      Object.values([
        "app/javascript/**/*.{js,jsx}",
        "plugins/*/app/javascript/**/*.{js,jsx}",
        "app/**/*.{scss,sass,css,haml,html}",
        "plugins/**/*.{scss,sass,css,haml,html}",
      ]),
      {
        // eslint-disable-next-line no-useless-escape
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
      }
    )

    // Add event listeners.
    watcher
      .on("ready", () => {
        log(blue, "◻️ Watching for changes 👀")
      })
      .on("add", (path) => {
        watcher.add(path)
        compile({ clear: true, change: true }).then(() => {
          log(grey, " ◻️ Reason: file has been added 🚀")
          log(grey, ` ◻️ File: ${path}`)
        })
      })
      .on("change", (path) => {
        compile({ clear: true, change: true }).then(() => {
          log(grey, " ◻️ Reason: file has been changed ⚙️")
          log(grey, ` ◻️ File: ${path}`)
        })
      })
      .on("unlink", (path) => {
        compile({ clear: true, change: true }).then(() => {
          log(grey, " ◻️ Reason: file has been removed 💀")
          log(grey, ` ◻️ File: ${path}`)
        })
      })
      .on("addDir", (path) => {
        watch.add(`${path}*.{js,jsx}`)
        compile({ clear: true, change: true })
        log(grey, " ◻️ Reason: directory has been added 🚀")
        log(grey, ` ◻️ Directory: ${path}`)
      })
      .on("unlinkDir", (path) => {
        compile({ clear: true, change: true })
        log(grey, " ◻️ Reason: directory has been removed 💀")
        log(grey, ` ◻️ Directory: ${path}`)
      })
      .on("error", (error) => log(red, `Watcher error: ${error} 👎`))
  })
} else {
  compile()
}
