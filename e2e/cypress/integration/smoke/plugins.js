/**
 * Plugin Route Verification Tests
 *
 * These tests verify that all plugins are properly mounted and their routes
 * are accessible. Without authentication, we expect to either:
 * - Get a redirect to login (302)
 * - Get a "Please sign in" message
 * - NOT get a 404 error (which would indicate the plugin is not mounted)
 *
 * This helps catch common deployment issues like:
 * - Plugin not loaded
 * - Routing misconfiguration
 * - Missing JavaScript bundles
 */

const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN") || "cc3test"
const TEST_PROJECT = "test"

// List of all plugins and their mount points
const plugins = [
  { name: "audit", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/audit` },
  { name: "block_storage", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/block-storage` },
  { name: "compute", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/compute/instances` },
  { name: "dns_service", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/dns-service/zones` },
  { name: "email_service", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/email-service` },
  { name: "identity", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/identity` },
  { name: "image", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/image` },
  { name: "keppel", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/keppel` },
  { name: "keymanagerng", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/keymanager` },
  { name: "kubernetes", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/kubernetes` },
  { name: "kubernetes_ng", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/kubernetes-gardener` },
  { name: "lbaas2", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/lbaas2` },
  { name: "lookup", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/lookup` },
  { name: "masterdata_cockpit", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/masterdata-cockpit/project/` },
  { name: "metrics", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/metrics` },
  { name: "networking", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/networking` },
  { name: "object_storage", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/object-storage/swift` },
  { name: "reports", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/reports/cost/project` },
  { name: "inquiry", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/request/items` },
  { name: "resources", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/resources/v2/project` },
  { name: "shared_filesystem_storage", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/shared-filesystem-storage` },
  { name: "smartops", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/smartops` },
  { name: "tools", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/cc-tools` },
  { name: "webconsole", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/webconsole` },
]

describe("plugin routes are mounted", () => {
  plugins.forEach((plugin) => {
    it(`${plugin.name} plugin is accessible (redirects to login)`, () => {
      // We use cy.request with failOnStatusCode: false to handle redirects
      // The key assertion is that we don't get a 404
      cy.request({
        url: plugin.path,
        failOnStatusCode: false,
        followRedirect: false, // Don't follow redirects automatically
      }).then((response) => {
        // Plugin route should NOT return 404 (not found)
        expect(response.status, `${plugin.name} should not return 404`).to.not.eq(404)

        // Acceptable responses:
        // - 200: Page loaded (might show login prompt)
        // - 302/303: Redirect to login page
        // - 401: Unauthorized (but route exists)
        const acceptableStatuses = [200, 301, 302, 303, 401]
        expect(
          acceptableStatuses,
          `${plugin.name} should return an acceptable status code (got ${response.status})`
        ).to.include(response.status)
      })
    })
  })
})

describe("domain-level routes", () => {
  it("domain home redirects to login", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/home`,
      failOnStatusCode: false,
      followRedirect: false,
    }).then((response) => {
      expect(response.status).to.not.eq(404)
    })
  })

  it("auth login page is accessible", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/auth/login/${TEST_DOMAIN}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})

describe("identity plugin routes", () => {
  it("project home route exists", () => {
    cy.request({
      url: `/${TEST_DOMAIN}/${TEST_PROJECT}/identity/project/home`,
      failOnStatusCode: false,
      followRedirect: false,
    }).then((response) => {
      expect(response.status).to.not.eq(404)
    })
  })
})
