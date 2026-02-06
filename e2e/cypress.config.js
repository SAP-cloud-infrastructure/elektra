// https://docs.cypress.io/guides/references/configuration
const { defineConfig } = require("cypress")

module.exports = defineConfig({
  // Disable deprecated Cypress.env() API to prevent security warnings
  // Use cy.env() for sensitive values and Cypress.expose() for public configuration
  allowCypressEnv: false,
  e2e: {
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 20000,
    viewportWidth: 1300,
    viewportHeight: 1100,
    video: true,
    videoCompression: 20,
    chromeWebSecurity: false,
    includeShadowDom: true,
    supportFile: "cypress/support/index.js", // Path to file to load before spec files load. This file is compiled and bundled. (Pass false to disable)
    specPattern: "cypress/integration/**/*.{js,jsx}", // A String or Array of glob patterns of the test files to load.
    setupNodeEvents(on, config) {
      // Populate expose config from CYPRESS_ environment variables
      // This allows run.sh to pass TEST_DOMAIN via CYPRESS_TEST_DOMAIN
      config.expose = config.expose || {}
      if (process.env.CYPRESS_TEST_DOMAIN) {
        config.expose.TEST_DOMAIN = process.env.CYPRESS_TEST_DOMAIN
      }
      return config
    },
  },
})
