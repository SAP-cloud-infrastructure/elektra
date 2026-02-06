// https://docs.cypress.io/guides/references/configuration
const { defineConfig } = require("cypress")
const fs = require("fs")

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
      // TEST_DOMAIN is used in many places to construct URLs, so we expose it for easy synchronous access via Cypress.expose()
      config.expose = config.expose || {}
      if (process.env.CYPRESS_TEST_DOMAIN) {
        config.expose.TEST_DOMAIN = process.env.CYPRESS_TEST_DOMAIN
      }
      // Note we could also expose TEST_USER and TEST_PASSWORD, but they are only used in one place and it's better to access them securely via cy.env() in that case
      // Cypress.expose() - For public, non-sensitive configuration that's accessed frequently and synchronously (like domain names, feature flags, API versions)
      // cy.env() - For sensitive values (passwords, API keys, tokens) that benefit from the extra security of async access
      // | Variable    | API              | Reads from    | Auto-populated from CYPRESS_*? | Needs bridging? |
      // |---------------|----------------|---------------| -------------------------------|-----------------|
      // | TEST_DOMAIN | Cypress.expose() | config.expose | No                             | Yes             |
      // | TEST_USER   | cy.env()         | config.env    | Yes                            | No              |
      // | TEST_PASSWORD | cy.env()       | config.env    | Yes                            | No              |

      // Delete videos for specs that passed (only keep videos for failed specs)
      // to save disk space and because videos for passing specs are usually not needed
      on("after:spec", (spec, results) => {
        if (results && results.video) {
          // Check if all tests passed
          const allTestsPassed = results.tests?.every((test) =>
            test.attempts?.every((attempt) => attempt.state === "passed")
          )

          if (allTestsPassed) {
            // Delete the original video
            fs.unlink(results.video, (err) => {
              if (err && err.code !== "ENOENT") {
                console.warn(`Could not delete video for passing spec: ${err.message}`)
              }
            })

            // Also delete the compressed video (e.g., smartops.js.mp4 -> smartops.js-compressed.mp4)
            const compressedVideo = results.video.replace(".mp4", "-compressed.mp4")
            fs.unlink(compressedVideo, (err) => {
              if (err && err.code !== "ENOENT") {
                console.warn(`Could not delete compressed video for passing spec: ${err.message}`)
              }
            })
          }
        }
      })

      return config
    },
  },
})
