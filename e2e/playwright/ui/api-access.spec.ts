import { test, expect } from "@playwright/test"
import { loginAsMember } from "../helpers/auth"

/**
 * API Access Tests
 *
 * These tests verify that authenticated users can access API endpoints pages.
 * Tests require Rails running in e2e mode with mock services.
 */

const TEST_DOMAIN = process.env.TEST_DOMAIN || "cc3test"
const TEST_PROJECT = "test" // Standard test project in e2e environment

test.describe("API Access - Member User", () => {
  test.beforeEach(async ({ page }) => {
    // Login as member user
    await loginAsMember(page)
  })

  test("can access API endpoints for clients page", async ({ page }) => {
    // Navigate to API endpoints page
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/projects/api-endpoints`)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("API Endpoints for Clients")

    // Verify help text is present
    await expect(page.locator("text=/access the project with the openstack client/i")).toBeVisible()
  })

  test("API endpoints page contains expected sections", async ({ page }) => {
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/projects/api-endpoints`)

    // Wait for page to be fully loaded with correct title
    await expect(page.locator("[data-test=page-title]")).toContainText("API Endpoints for Clients")

    // Verify expected content is present
    await expect(page.locator("text=/Domain ID/i")).toBeVisible()
    await expect(page.locator("text=/Project ID/i")).toBeVisible()
  })
})

test.describe("Web Shell - Member User", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMember(page)
  })

  test("can open web shell page", async ({ page }) => {
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/webconsole/`)

    // Verify page title
    await expect(page.locator("[data-test=page-title]")).toContainText("Web Shell")
  })

  test("can open web shell from toolbar", async ({ page }) => {
    // Navigate to project home
    await page.goto(`/${TEST_DOMAIN}/${TEST_PROJECT}/identity/project/home`)

    // Click web shell button in toolbar
    await page.click('[data-trigger="webconsole:open"]')

    // Verify web shell toolbar is present
    await expect(page.locator('div.toolbar:has-text("Web Shell")')).toBeVisible()
  })
})
