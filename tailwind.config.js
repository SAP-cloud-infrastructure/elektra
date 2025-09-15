// important: we need to import here the tailwind config from juno-ui-components instead of using require("@cloudoperators/juno-ui-components/tailwind.config.js")
// because juno-ui-components is a esm module and we cannot use require in this file.
import uiComponentsConfig from "@cloudoperators/juno-ui-components/tailwind.config.js"

module.exports = {
  // use juno tailwindcss as default
  presets: [uiComponentsConfig],
  prefix: "tw-", // important, do not change
  content: [
    "./plugins/**/*.{js,jsx,ts,tsx,html,haml}",
    "./app/javascript/**/*.{js,jsx,ts,tsx,haml}",
    "./app/views/**/*.{haml,html}",
  ],

  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],

  darkMode: "class",
}
