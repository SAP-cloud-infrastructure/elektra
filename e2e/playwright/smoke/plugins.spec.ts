import { test, expect } from "@playwright/test"

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
 *
 * Run with: pnpm e2e:smoke -- --host http://localhost:PORT plugins
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test"

// List of all plugins and their mount points
const plugins = [
  { name: "audit", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/audit` },
  { name: "block_storage", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/block-storage` },
  { name: "compute", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/compute/instances` },
  { name: "dns_service", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/dns-service/zones` },
  { name: "email_service", path: `/${TEST_DOMAIN}/${TEST_PROJECT}/email_service` },
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

test.describe("plugin routes are mounted", () => {
  for (const plugin of plugins) {
    test(`${plugin.name} plugin is accessible (redirects to login)`, async ({ request }) => {
      // We use request API with maxRedirects: 0 to handle redirects manually
      // The key assertion is that we don't get a 404
      const response = await request.get(plugin.path, {
        maxRedirects: 0,
      })

      // Plugin route should NOT return 404 (not found)
      expect(response.status(), `${plugin.name} should not return 404`).not.toBe(404)

      // Acceptable responses:
      // - 200: Page loaded (might show login prompt)
      // - 301/302/303: Redirect to login page
      // - 401: Unauthorized (but route exists)
      const acceptableStatuses = [200, 301, 302, 303, 401]
      expect(
        acceptableStatuses,
        `${plugin.name} should return an acceptable status code (got ${response.status()})`
      ).toContain(response.status())
    })
  }
})

test.describe("domain-level routes", () => {
  test("domain home redirects to login", async ({ request }) => {
    const response = await request.get(`/${TEST_DOMAIN}/home`, {
      maxRedirects: 0,
    })
    expect(response.status()).not.toBe(404)
  })

  test("auth login page is accessible", async ({ request }) => {
    const response = await request.get(`/${TEST_DOMAIN}/auth/login/${TEST_DOMAIN}`)
    expect(response.status()).toBe(200)
  })
})

test.describe("identity plugin routes", () => {
  test("project home route exists", async ({ request }) => {
    const response = await request.get(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/project/home`, {
      maxRedirects: 0,
    })
    expect(response.status()).not.toBe(404)
  })
})
